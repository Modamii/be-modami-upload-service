export enum HealthLabel {
  MEMORY_HEAP_KEY = 'memory_heap',
  DATABASE_KEY = 'database',
  KAFKA_KEY = 'kafka',
  STORAGE = 'storage',
  REDIS_KEY = 'redis',
}

export const HEALTH_CHECK_STORAGE_THRESHOLD_PERCENT =
  parseInt(process.env.HEALTH_CHECK_STORAGE_THRESHOLD_PERCENT) || 0.95;

export const HEALTH_CHECK_STORAGE_THRESHOLD_IN_BYTE =
  parseInt(process.env.HEALTH_CHECK_STORAGE_THRESHOLD_IN_BYTE) ||
  5 * 1024 * 1024 * 1024;

export const DISK_STORAGE = 'disk storage';
