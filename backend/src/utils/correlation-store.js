const { AsyncLocalStorage } = require('node:async_hooks');

/**
 * Shared store for tracking request-specific data like correlation IDs
 * across asynchronous execution contexts.
 */
const correlationStore = new AsyncLocalStorage();

module.exports = correlationStore;
