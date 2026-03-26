import * as Redis from 'ioredis';
import { IRedisConfig } from '../../..//configs/config.interface';

export class RedisStore {
  public static create(options: IRedisConfig): Redis.Redis {
    const sslConfig = options.ssl
      ? {
          tls: {
            host: options.host,
            port: options.port,
          },
        }
      : { tls: {} };
    return new Redis.default({
      keyPrefix: options.prefix,
      host: options.host,
      port: options.port,
      password: options.password,
      username: options.username,
      db: options.db,
      ...sslConfig,
    });
  }
}
