import { Request } from 'express';
import { Exception, EXCEPTIONS } from '../../common/exceptions';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IsPrivateOps, SYSTEM_ACTOR } from '../auth.constant';

/**
 * AuthUser decorator resolve auth user info
 */
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    if (IsPrivateOps(request.url)) {
      request.user = SYSTEM_ACTOR as any;
    }

    if (!request.user) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `user=${request.user}`,
      });
    }
    return request.user;
  },
);
