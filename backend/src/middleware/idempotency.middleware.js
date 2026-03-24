const crypto = require('crypto');
const { client } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Middleware to enforce idempotency on mutation requests.
 * Uses the 'Idempotency-Key' header to cache and replay successful responses.
 *
 * Requirements:
 * 1. Must be placed AFTER auth middleware to access req.user.
 * 2. Caches only successful (2xx) responses.
 * 3. Prevents key reuse with different request bodies (returns 409 Conflict).
 */
const idempotency = async (req, res, next) => {
    const key = req.header('Idempotency-Key');

    // Skip if no idempotency key or if it's not a mutation/side-effect method.
    if (!key || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Redis Key Schema: idempotency:{userId}:{clientKey}
    const userId = req.user ? req.user.id : 'anonymous';
    const redisKey = `idempotency:${userId}:${key}`;
    const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours

    try {
        const cachedResponse = await client.get(redisKey);
        const bodyHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

        if (cachedResponse) {
            const { requestHash, statusCode, body } = JSON.parse(cachedResponse);

            // Verify that the request body matches the one used for the original request.
            if (requestHash !== bodyHash) {
                return res.status(409).json({
                    error: 'Idempotency Conflict',
                    message: 'The provided Idempotency-Key was already used with a different request payload.',
                });
            }

            logger.info(`[Idempotency] Replaying cached response for key: ${key}`);
            return res.status(statusCode).json(body);
        }

        /**
         * Intercept response to store successful results.
         * We override res.json to capture the data before it's sent.
         */
        const originalJson = res.json;
        res.json = function (data) {
            // Only cache successful mutations (200-299)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const payloadToCache = {
                    requestHash: bodyHash,
                    statusCode: res.statusCode,
                    body: data,
                };

                client.setEx(redisKey, IDEMPOTENCY_TTL, JSON.stringify(payloadToCache)).catch((err) => {
                    logger.error('[Idempotency] Failed to store result in Redis:', err);
                });
            }

            // Restore original res.json behavior
            return originalJson.call(this, data);
        };

        next();
    } catch (error) {
        logger.error('[Idempotency] Middleware internal error:', error);
        // In case of Redis failure, we proceed with the request to avoid blocking users
        next();
    }
};

module.exports = idempotency;
