import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { LogLevels } from "../../constants";

const transport = new DailyRotateFile({
	filename: "./data/logs/app-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	maxSize: "10m",
	maxFiles: "28d"
});

export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

let currentLogLevel: LogLevel = LogLevels.Info; 

const logger = winston.createLogger({
  level: currentLogLevel,
  format: winston.format.combine(
	winston.format.timestamp({
		format: () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') // Remove milliseconds
	}),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${level.toUpperCase()}] ${timestamp}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    transport
  ]
});

export const setLogLevel = (level: LogLevel) => {
  logger.level = level;
  currentLogLevel = level;
  logger.info(`Log level changed to: ${level}`);
};

export default logger;