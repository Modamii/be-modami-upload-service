import { CacheManageService } from '../../third-parties/cache/src';
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  public constructor(private readonly cacheManageService: CacheManageService) {
    super();
  }
  public async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const cacheService = this.cacheManageService.getCacheService();
      if (cacheService) {
        const ok = await cacheService.ping();
        if (!ok) {
          return this.getStatus(key, false, null);
        }
      }

      const sharedCacheService =
        this.cacheManageService.getSharedCacheService();
      if (sharedCacheService) {
        const ok = await sharedCacheService.ping();
        if (!ok) {
          return this.getStatus(key, false, null);
        }
      }

      return this.getStatus(key, true, null);
    } catch (ex) {
      throw new HealthCheckError(
        ex.message,
        this.getStatus(key, false, {
          message: ex.message,
        }),
      );
    }
  }
}
