import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { Exception, EXCEPTIONS } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);
  public constructor(private _appEnv: string, private _rootPath: string) {}

  public catch(exception: any, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    this.logger.log({
      exception,
      url: ctx.getRequest()?.url,
      method: ctx.getRequest()?.method,
    });
    const response = ctx.getResponse<Response>();
    if (exception instanceof Exception) {
      return this.handleException(exception, response);
    } else if (exception instanceof HttpException) {
      if (exception instanceof ServiceUnavailableException) {
        return this.handleServiceUnavailableException(exception, response);
      }
      if (exception instanceof PayloadTooLargeException) {
        return this.handleException(
          new Exception(EXCEPTIONS.UPLOAD.FILE_SIZE),
          response,
        );
      }
      return this.handleHttpException(exception, response);
    } else {
      return this.handleUnKnowException(exception, response);
    }
  }

  protected handleException(
    exception: Exception,
    response: Response,
  ): Response {
    return response.status(exception.statusCode).json(
      new ResponseDto({
        success: false,
        error: {
          code: exception.customCode,
          message: exception.message,
        },
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          ...(this.isDevelop() && {
            detailedError: exception.detailedError
              ? String(exception.detailedError)
              : undefined,
            stack: this.getStack(exception),
          }),
        },
      }),
    );
  }

  protected handleHttpException(
    exception: HttpException,
    response: Response,
  ): Response {
    const status = exception.getStatus();
    let code = EXCEPTIONS.COMMON.INTERNAL_SERVER_ERROR.customCode;

    if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
      code = EXCEPTIONS.COMMON.VALIDATION_ERROR.customCode;
    }
    return response.status(status).json(
      new ResponseDto({
        success: false,
        error: {
          code,
          message: exception.message,
        },
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          ...(this.isDevelop() && {
            detailedError: JSON.stringify(exception.getResponse()),
            stack: this.getStack(exception),
          }),
        },
      }),
    );
  }

  protected handleUnKnowException(
    exception: Error,
    response: Response,
  ): Response {
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      new ResponseDto({
        success: false,
        error: {
          code: EXCEPTIONS.COMMON.INTERNAL_SERVER_ERROR.customCode,
          message: exception['message'],
        },
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          ...(this.isDevelop() && {
            stack: this.getStack(exception),
          }),
        },
      }),
    );
  }

  protected handleServiceUnavailableException(
    exception: ServiceUnavailableException,
    response: Response,
  ): Response {
    const status = exception.getStatus();
    return response.status(status).json(
      new ResponseDto({
        success: false,
        error: {
          code: EXCEPTIONS.COMMON.SERVICE_UNAVAILABLE.customCode,
          message: exception.message,
        },
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          ...(this.isDevelop() && {
            stack: this.getStack(exception),
          }),
        },
      }),
    );
  }

  private getStack(exception: Exception | Error): string[] {
    return exception.stack?.split('\n');
  }

  private isDevelop(): boolean {
    if (['development', 'sandbox', 'staging'].includes(this._appEnv)) {
      return true;
    }
    return false;
  }
}
