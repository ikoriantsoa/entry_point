import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { format } from 'date-fns';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private logger: winston.Logger;
  private environment: string;

  constructor(private context?: string) {
    this.environment = process.env.NODE_ENV || 'development';

    this.logger = winston.createLogger({
      levels: winston.config.npm.levels,
      level: 'silly',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, code }) => {
          const humanReadableDate = this.formatDate(new Date());
          const contextName = this.context || 'APP';
          const httpCode = code ? `[${code}]` : '';
          return `[${humanReadableDate}] [${this.environment}] [${level.toUpperCase()}] [${contextName}] ${httpCode}: ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, code?: number): void {
    this.logger.info(message, { code });
  }

  error(message: string, trace?: string, code?: number): void {
    this.logger.error(message, { trace, code });
  }

  warn(message: string, code?: number): void {
    this.logger.warn(message, { code });
  }

  debug(message: string, code?: number): void {
    this.logger.debug(message, { code });
  }

  verbose(message: string, code?: number): void {
    this.logger.verbose(message, { code });
  }

  silly(message: string, code?: number): void {
    this.logger.silly(message, { code });
  }
}
