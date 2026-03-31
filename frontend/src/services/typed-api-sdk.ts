// typed-api-sdk.ts

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiClientError };

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeout?: number;
}

export enum ErrorSeverity {
  RETRYABLE = "RETRYABLE",
  TERMINAL = "TERMINAL",
}

export enum ErrorDomain {
  API = "API",
}

export interface ApiClientError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  domain: ErrorDomain;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 300;

// ---- Helpers (minimal implementations) ----

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeUnauthorizedError(): ApiClientError {
  return {
    code: "UNAUTHORIZED",
    message: "Authentication required",
    severity: ErrorSeverity.TERMINAL,
    domain: ErrorDomain.API,
  };
}

function normalizeApiClientError(
  err: ApiClientError,
  _meta?: Record<string, unknown>,
): ApiClientError {
  return err;
}

function mapRpcError(err: any): ApiClientError {
  return {
    code: "NETWORK_ERROR",
    message: err?.message || "Network error",
    severity: ErrorSeverity.RETRYABLE,
    domain: ErrorDomain.API,
  };
}

function mapApiError(
  err: Record<string, unknown>,
): ApiClientError {
  return {
    code: "API_ERROR",
    message: String(err.message ?? "API error"),
    severity: ErrorSeverity.TERMINAL,
    domain: ErrorDomain.API,
  };
}

function dispatchApiTrace(_data: any) {
  // no-op (stub)
}

// ---- Session Store ----

interface SessionStore {
  getToken(): string | null;
}

// ---- MAIN CLASS ----

export class ApiClient {
  private _baseUrl: string;
  private _sessionStore?: SessionStore;

  constructor(baseUrl: string, sessionStore?: SessionStore) {
    this._baseUrl = baseUrl;
    this._sessionStore = sessionStore;
  }

  private async _request<T>(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    requiresAuth: boolean,
    opts: ApiRequestOptions = {},
  ): Promise<ApiResult<T>> {
    const token = this._sessionStore?.getToken() ?? null;

    if (requiresAuth && token === null) {
      return { success: false, error: makeUnauthorizedError() };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token !== null) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let requestSignal = opts.signal;

    if (opts.timeout !== undefined) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort("timeout"), opts.timeout);

      if (requestSignal) {
        requestSignal.addEventListener("abort", () =>
          controller.abort(requestSignal?.reason),
        );
        requestSignal = controller.signal;
      } else {
        requestSignal = controller.signal;
      }
    }

    const url = `${this._baseUrl}${path}`;
    let lastError: ApiClientError | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
      }

      if (requestSignal?.aborted) {
        return {
          success: false,
          error: {
            code: "ABORTED",
            message: "Request aborted",
            severity: ErrorSeverity.TERMINAL,
            domain: ErrorDomain.API,
          },
        };
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: requestSignal,
        });

        if (response.ok) {
          const data = (await response.json()) as T;
          return { success: true, data };
        }

        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { status: response.status };
        }

        const mapped = normalizeApiClientError(mapApiError(errorBody));
        lastError = mapped;

        if (mapped.severity !== ErrorSeverity.RETRYABLE) {
          return { success: false, error: mapped };
        }
      } catch (err: any) {
        const mapped = normalizeApiClientError(mapRpcError(err));
        lastError = mapped;

        if (mapped.severity !== ErrorSeverity.RETRYABLE) {
          return { success: false, error: mapped };
        }
      }
    }

    return { success: false, error: lastError! };
  }
}