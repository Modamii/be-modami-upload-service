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
        code: exception.customCode,
        meta: {
          message: exception.message,
          detailedError: this.isDevelop() ? exception.detailedError : null,
          stack: this.isDevelop() ? this.getStack(exception) : null,
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
        code: code,
        meta: {
          message: exception.message,
          stack: this.isDevelop() ? this.getStack(exception) : null,
          detailedError: JSON.stringify(exception.getResponse()),
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
        code: EXCEPTIONS.COMMON.INTERNAL_SERVER_ERROR.customCode,
        meta: {
          message: exception['message'],
          stack: this.isDevelop() ? this.getStack(exception) : null,
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
        data: exception.getResponse(),
        code: EXCEPTIONS.COMMON.SERVICE_UNAVAILABLE.customCode,
        meta: {
          message: exception.message,
          stack: this.getStack(exception),
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
