const fs = require('fs');
const path = require('path');
const winston = require('winston');
const correlationStore = require('../utils/correlation-store');

// Ensure logs directory exists
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom winston format to inject correlationId from AsyncLocalStorage into log entries.
 */
const correlate = winston.format((info) => {
  const store = correlationStore.getStore();
  if (store && store.correlationId) {
    info.correlationId = store.correlationId;
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    correlate(), // Injects the IDs into metadata
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, correlationId }) => {
          const idPrefix = correlationId ? ` [${correlationId}]` : '';
          return `${timestamp} ${level}:${idPrefix} ${message}`;
        })
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

module.exports = logger;
