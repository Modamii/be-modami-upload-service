import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { map, Observable } from 'rxjs';
import { CUSTOM_CODE } from '../constants/custom-code.constant';

@Injectable()
export class HandleResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        let message = 'OK';
        if (response.responseMessage) {
          message = response.responseMessage.success;
        }
        return {
          code: CUSTOM_CODE.SUCCESS,
          data,
          meta: {
            message: message,
          },
        };
      }),
    );
  }
}
