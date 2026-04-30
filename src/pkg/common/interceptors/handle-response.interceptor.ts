import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ResponseDto } from '../dto';
import { map, Observable } from 'rxjs';

@Injectable()
export class HandleResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
        },
      })),
    );
  }
}
