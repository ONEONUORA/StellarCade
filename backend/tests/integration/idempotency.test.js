const request = require('supertest');
const express = require('express');

// Mock Redis to avoid connection issues during tests
jest.mock('../../src/config/redis', () => {
    const mockClient = {
        get: jest.fn(),
        setEx: jest.fn().mockResolvedValue('OK'),
        connect: jest.fn().mockResolvedValue('OK'),
        on: jest.fn(),
        isOpen: true,
    };
    return { client: mockClient, connectPromise: Promise.resolve() };
});

// Mock Auth Middleware to bypass JWT checks and provide req.user
jest.mock('../../src/middleware/auth.middleware', () => (req, res, next) => {
    req.user = { id: 1 };
    next();
});

const { client } = require('../../src/config/redis');
const walletRouter = require('../../src/routes/wallet.routes');

// Mock wallet controller to isolate middleware testing
jest.mock('../../src/controllers/wallet.controller', () => ({
    deposit: jest.fn((req, res) => res.status(200).json({ success: true, balance: 100 })),
    withdraw: jest.fn((req, res) => res.status(200).json({ success: true, balance: 50 })),
}));

const walletController = require('../../src/controllers/wallet.controller');

const app = express();
app.use(express.json());

// In our test environment, we mount the wallet router
// The mocked auth middleware will run as part of the router's middleware stack
app.use('/api/wallet', walletRouter);

describe('Idempotency Middleware Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should process a first-time request and cache the result', async () => {
        client.get.mockResolvedValue(null); // Not in cache

        const res = await request(app)
            .post('/api/wallet/deposit')
            .set('Idempotency-Key', 'unique-key-1')
            .send({ amount: 100 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(walletController.deposit).toHaveBeenCalledTimes(1);

        // Verify it was saved to Redis
        expect(client.setEx).toHaveBeenCalledWith(
            'idempotency:1:unique-key-1',
            24 * 60 * 60, // TTL
            expect.stringContaining('"success":true')
        );
    });

    test('should return cached response for a replayed request', async () => {
        const crypto = require('crypto');
        const bodyHash = crypto.createHash('sha256').update(JSON.stringify({ amount: 100 })).digest('hex');

        client.get.mockResolvedValue(JSON.stringify({
            requestHash: bodyHash,
            statusCode: 200,
            body: { success: true, fromCache: true }
        }));

        const res = await request(app)
            .post('/api/wallet/deposit')
            .set('Idempotency-Key', 'existing-key')
            .send({ amount: 100 });

        expect(res.status).toBe(200);
        expect(res.body.fromCache).toBe(true);
        // Controller should NOT be called
        expect(walletController.deposit).not.toHaveBeenCalled();
    });

    test('should return 409 Conflict if same key is used with a different body', async () => {
        client.get.mockResolvedValue(JSON.stringify({
            requestHash: 'original-hash',
            statusCode: 200,
            body: { success: true }
        }));

        const res = await request(app)
            .post('/api/wallet/deposit')
            .set('Idempotency-Key', 'same-key')
            .send({ amount: 999 }); // This will generate a different hash

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Idempotency Conflict');
        expect(walletController.deposit).not.toHaveBeenCalled();
    });

    test('should skip idempotency if the header is missing', async () => {
        client.get.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/wallet/deposit')
            .send({ amount: 100 });

        expect(res.status).toBe(200);
        expect(client.get).not.toHaveBeenCalled();
        expect(walletController.deposit).toHaveBeenCalledTimes(1);
    });

    test('should not cache error responses (non-2xx)', async () => {
        client.get.mockResolvedValue(null);
        walletController.deposit.mockImplementationOnce((req, res) =>
            res.status(400).json({ success: false, error: 'Bad Request' })
        );

        const res = await request(app)
            .post('/api/wallet/deposit')
            .set('Idempotency-Key', 'error-key')
            .send({ amount: -1 });

        expect(res.status).toBe(400);
        // Should NOT call setEx for error
        expect(client.setEx).not.toHaveBeenCalled();
    });
});
