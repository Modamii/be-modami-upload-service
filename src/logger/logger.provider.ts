import { MyLogger } from './logger.service';

export class LoggerProvider {
  /**
   * Create log processors
   */
  public static init(): any {
    const logger = new MyLogger();
    // Setting types log by APP_DEBUG config
    logger.setLogLevels(['debug', 'error', 'log', 'verbose', 'warn']);
    return logger;
  }
}
