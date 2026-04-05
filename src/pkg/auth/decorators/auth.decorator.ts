import { Request } from 'express';
import { Exception, EXCEPTIONS } from '../../common/exceptions';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * AuthUser decorator resolve auth user info
 */
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `user=${request.user}`,
      });
    }
    return request.user;
  },
);
