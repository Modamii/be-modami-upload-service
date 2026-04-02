import { Injectable } from '@nestjs/common';
import { HealthIndicator } from '@nestjs/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  public async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return this.getStatus(key, true, null);
  }
}
