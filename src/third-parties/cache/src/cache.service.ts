import * as Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRedisConfig } from '../../../configs/config.interface';
import { RedisStore } from './redis.store';
import { hasCacheConfig } from './cache.utils';

@Injectable()
export class CacheManageService {
  private cacheClient: CacheService;
  private sharedCacheClient: CacheService;

  public constructor(private configService: ConfigService) {
    const redisConfig = this.configService.get<IRedisConfig>('redis');
    if (hasCacheConfig(redisConfig)) {
      this.cacheClient = new CacheService(RedisStore.create(redisConfig));
    }

    const redisSharedStoreConfig =
      this.configService.get<IRedisConfig>('redisSharedStore');
    if (hasCacheConfig(redisSharedStoreConfig)) {
      this.sharedCacheClient = new CacheService(
        RedisStore.create(redisSharedStoreConfig),
      );
    }
  }
  public getCacheService(): CacheService {
    return this.cacheClient;
  }
  public getSharedCacheService(): CacheService {
    return this.sharedCacheClient;
  }
}

@Injectable()
export class CacheService {
  public constructor(private readonly client: Redis.Cluster | Redis.Redis) {}
  public async ping(): Promise<boolean> {
    return (await this.client.ping()) === 'PONG';
  }

  public async set(key: string, value: unknown): Promise<any> {
    return await this.client.set(key, JSON.stringify(value));
  }

  public async get<T>(key: string): Promise<T> {
    const result = await this.client.get(key);
    try {
      return JSON.parse(result) as unknown as T;
    } catch (e) {
      return null;
    }
  }

  public async mget(keys: string[]): Promise<any> {
    const result = await this.client.mget(keys);
    try {
      return result.map((r) => JSON.parse(r));
    } catch (e) {
      return [];
    }
  }

  public async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  public async reset(): Promise<'OK'> {
    return await this.client.flushdb();
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }
}
