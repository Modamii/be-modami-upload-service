import { ConsoleLogger } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';

export class MyLogger extends ConsoleLogger {
  private winston: Logger;
  constructor() {
    super();
    const formatConfig =
      process.env.NODE_ENV == 'development'
        ? format.combine(format.timestamp(), format.colorize(), format.simple())
        : format.combine(format.timestamp(), format.json());
    this.winston = createLogger({
      level: 'silly',
      format: formatConfig,
      transports: [new transports.Console()],
    });
  }
  error(...args): void {
    this.winston.error(this.toJson(args));
  }

  warn(...args): void {
    this.winston.warn(this.toJson(args));
  }

  log(...args): void {
    this.winston.info(this.toJson(args));
  }

  debug(...args): void {
    this.winston.debug(this.toJson(args));
  }

  verbose(...args): void {
    this.winston.verbose(this.toJson(args));
  }

  toJson(args: any[]) {
    const json = {};
    let message = '';
    let error = '';
    for (const e of args) {
      if (typeof e === 'string') {
        message += ' ' + e;
      } else if (e instanceof Error) {
        error += `${e.message}\n${e.stack}\n`;
      } else if (Array.isArray(e)) {
        message += ' ' + JSON.stringify(e);
      } else if (typeof e === 'object' && Object.keys(e).length > 0) {
        for (const key of Object.keys(e)) {
          if (e[key] instanceof Error) {
            error += `${e[key].message}\n${e[key].stack}\n`;
            delete e[key];
          }
          if (key === 'message') {
            message += ' ' + e[key];
          }
          json[key] = e[key];
        }
      } else if (e === undefined) {
      } else {
        message += ' ' + JSON.stringify(e);
      }
    }
    json['message'] = message.trimStart();
    if (error) {
      json['error'] = error;
    }
    return json;
  }
}
