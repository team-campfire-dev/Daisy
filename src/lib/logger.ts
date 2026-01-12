import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp()),
    transports: [
        new winston.transports.Console({
            format:
                process.env.NODE_ENV === 'production'
                    ? json() // JSON format for production (Docker)
                    : combine(colorize(), devFormat), // Readable format for development
        }),
    ],
});
