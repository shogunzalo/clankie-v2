"use strict";

const pino = require("pino");

// Create logger configuration based on environment
const loggerConfig = {
    level:
        process.env.LOG_LEVEL ||
        (process.env.NODE_ENV === "production" ? "info" : "debug"),
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: "SYS:standard",
                      ignore: "pid,hostname",
                  },
              }
            : undefined,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};

// Create the logger instance
const logger = pino(loggerConfig);

// Create child loggers for different modules
const createChildLogger = (module) => {
    return logger.child({ module });
};

module.exports = {
    logger,
    createChildLogger,
};
