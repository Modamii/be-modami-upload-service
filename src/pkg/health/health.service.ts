import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthIndicatorResult,
  StorageExceededError,
} from '@nestjs/terminus';
import * as fs from 'fs';
import {
  DISK_STORAGE,
  HealthLabel,
  HEALTH_CHECK_STORAGE_THRESHOLD_PERCENT,
} from './health.constants';
import { STORAGE_EXCEEDED } from './health.helper';

@Injectable()
export class HealthService {
  constructor(private diskHealthIndicator: DiskHealthIndicator) {}
  public async checkStorage(
    path: string,
    thresholdInByte: number,
  ): Promise<HealthIndicatorResult> {
    await this.diskHealthIndicator.checkStorage(HealthLabel.STORAGE, {
      path: '/',
      thresholdPercent: HEALTH_CHECK_STORAGE_THRESHOLD_PERCENT,
    });

    const stat = fs.statSync(path);
    const isHealthy = stat.size < thresholdInByte;
    if (!isHealthy) {
      throw new StorageExceededError(DISK_STORAGE, {
        [HealthLabel.STORAGE]: {
          status: 'down',
          message: STORAGE_EXCEEDED(DISK_STORAGE),
          error: `size ${path} > ${thresholdInByte}`,
        },
      });
    }
    return { [HealthLabel.STORAGE]: { status: 'up' } };
  }
}
