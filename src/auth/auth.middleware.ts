import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import * as axios from 'axios';
import { Request } from 'express';
import { Exception, EXCEPTIONS } from '../common/exceptions';
import { CacheManageService } from '../third-parties/cache/src';
import { CachePrefixService } from './../third-parties/cache/src/dto/cache.dto';
import { AuthService } from './auth.service';
import { UserSharedDto } from './dto/user-shared.dto';

const GlobalUsernameCache: { [key: string]: string } = {};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  logger = new Logger(AuthMiddleware.name);
  public constructor(
    private authService: AuthService,
    private cacheManageService: CacheManageService,
  ) {}

  public async use(
    req: Request,
    res: Response,
    next: () => void,
  ): Promise<void> {
    // Support API gateway
    if (req.headers?.user) {
      const payload = JSON.parse(req.headers?.user as string);
      req.user = this.authService.getUser(payload);

      if (req.user.username) {
        req.user.id = await this.getUserIdByUsername(req.user.username);
      }

      if (!req.user.id || req.user.id === '') {
        throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
          detailedError: `not found userId`,
        });
      }
      return next();
    }

    const token = req.headers.authorization;
    if (!token) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `token=${token}`,
      });
    }
    req.user = await this.authService.login(token);
    if (req.user.username) {
      req.user.id = await this.getUserIdByUsername(req.user.username);
    }
    next();
  }

  private async getUserIdByUsername(username: string): Promise<string> {
    if (!GlobalUsernameCache[username]) {
      const user: UserSharedDto = await this.cacheManageService
        .getSharedCacheService()
        .get(`${CachePrefixService.user}:profile:${username}`);
      if (user?.id) {
        GlobalUsernameCache[user.username] = user.id;
        this.logger.log({ message: 'Get user id from redis' });
      }
    }

    if (!GlobalUsernameCache[username]) {
      const url = new URL(
        `/internal/users/${username}`,
        process.env.USER_SERVICE_URL,
      ).href;
      try {
        if (process.env.USER_SERVICE_URL) {
          const res = await axios.default.get(url);
          this.logger.debug({
            message: 'Get user id from user',
          });
          if (res.status == 200 && res.data.data?.id) {
            this.logger.log({
              message: 'Get user id from user service',
              username,
              userId: res.data.data.id,
            });
            GlobalUsernameCache[username] = res.data.data.id;
            return res.data.data.id;
          }
        }
      } catch (err) {
        this.logger.log({
          message: 'Get user id from user error',
          error: err,
          url: url,
        });
      }

      throw new Exception(EXCEPTIONS.COMMON.NOT_FOUND_USER_IN_CACHE).withFields(
        {
          detailedError: `username=${username}`,
        },
      );
    }
    return GlobalUsernameCache[username];
  }
}
