# cross-contract-handler

## Public Methods

### `init`

Initialize with admin and optional registry contract. Call once.

```rust
pub fn init(env: Env, admin: Address, registry_contract: Address) -> Result<(), Error>
```

#### Parameters

| Name                | Type      |
| ------------------- | --------- |
| `env`               | `Env`     |
| `admin`             | `Address` |
| `registry_contract` | `Address` |

#### Return Type

`Result<(), Error>`

### `register_route`

Register a route: source_contract may dispatch to target_contract via selector. Admin only.

```rust
pub fn register_route(env: Env, admin: Address, source_contract: Address, target_contract: Address, selector: Symbol) -> Result<u32, Error>
```

#### Parameters

| Name              | Type      |
| ----------------- | --------- |
| `env`             | `Env`     |
| `admin`           | `Address` |
| `source_contract` | `Address` |
| `target_contract` | `Address` |
| `selector`        | `Symbol`  |

#### Return Type

`Result<u32, Error>`

### `dispatch`

Dispatch a request along a registered route. Caller must be admin or source_contract for that route.

```rust
pub fn dispatch(env: Env, caller: Address, request_id: Symbol, route_id: u32, payload: Bytes) -> Result<(), Error>
```

#### Parameters

| Name         | Type      |
| ------------ | --------- |
| `env`        | `Env`     |
| `caller`     | `Address` |
| `request_id` | `Symbol`  |
| `route_id`   | `u32`     |
| `payload`    | `Bytes`   |

#### Return Type

`Result<(), Error>`

### `acknowledge`

Acknowledge a pending request with a result. Caller must be admin or target_contract for that request's route.

```rust
pub fn acknowledge(env: Env, caller: Address, request_id: Symbol, result: Bytes) -> Result<(), Error>
```

#### Parameters

| Name         | Type      |
| ------------ | --------- |
| `env`        | `Env`     |
| `caller`     | `Address` |
| `request_id` | `Symbol`  |
| `result`     | `Bytes`   |

#### Return Type

`Result<(), Error>`

### `get_route`

Return the route for a given route_id, or None if not found.

```rust
pub fn get_route(env: Env, route_id: u32) -> Result<Route, Error>
```

#### Parameters

| Name       | Type  |
| ---------- | ----- |
| `env`      | `Env` |
| `route_id` | `u32` |

#### Return Type

`Result<Route, Error>`

### `get_call_status`

Get the status and metadata for a specific call by request_id. Returns a CallSnapshot with request_id, route_id, and current status (Pending, Acknowledged, or Failed). This accessor is read-only and does not mutate storage or depend on event replay.

```rust
pub fn get_call_status(env: Env, request_id: Symbol) -> Result<CallSnapshot, Error>
```

#### Parameters

| Name         | Type     |
| ------------ | -------- |
| `env`        | `Env`    |
| `request_id` | `Symbol` |

#### Return Type

`Result<CallSnapshot, Error>`

#### Behavior

- Returns `RequestNotFound` error if the call ID does not exist
- Call identifiers remain stable across the full lifecycle (pending → completed/failed)
- Completion metadata is compact and audit-friendly
- Deterministic lookup: missing call IDs always return `RequestNotFound`

### `mark_failed`

Mark a pending request as failed with error information. Caller must be admin or target_contract for that request's route. Cannot be called on already completed (acknowledged or failed) requests.

```rust
pub fn mark_failed(env: Env, caller: Address, request_id: Symbol, error_info: Bytes) -> Result<(), Error>
```

#### Parameters

| Name         | Type      |
| ------------ | --------- |
| `env`        | `Env`     |
| `caller`     | `Address` |
| `request_id` | `Symbol`  |
| `error_info` | `Bytes`   |

#### Return Type

`Result<(), Error>`

## Data Types

### `RequestStatus`

Enum representing the current status of a cross-contract call:

```rust
pub enum RequestStatus {
    Pending(u32, Bytes),      // (route_id, payload)
    Acknowledged(u32, Bytes), // (route_id, result)
    Failed(u32, Bytes),       // (route_id, error_info)
}
```

### `CallSnapshot`

Struct containing complete metadata for a cross-contract call:

```rust
pub struct CallSnapshot {
    pub request_id: Symbol,
    pub route_id: u32,
    pub status: RequestStatus,
}
```

## Error Codes

| Error                        | Code | Description                                        |
| ---------------------------- | ---- | -------------------------------------------------- |
| `AlreadyInitialized`         | 1    | Contract already initialized                       |
| `NotInitialized`             | 2    | Contract not initialized                           |
| `NotAuthorized`              | 3    | Caller not authorized                              |
| `RouteNotFound`              | 4    | Route ID not found                                 |
| `RequestNotFound`            | 5    | Request ID not found                               |
| `DuplicateRequestId`         | 6    | Request ID already exists                          |
| `RequestAlreadyAcknowledged` | 7    | Request already acknowledged                       |
| `InvalidRoute`               | 8    | Invalid route configuration                        |
| `RequestAlreadyCompleted`    | 9    | Request already completed (acknowledged or failed) |
