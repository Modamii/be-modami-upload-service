import * as Redis from 'ioredis';

export class RedisClusterStore {
  public static create(
    nodes: Redis.ClusterNode[],
    options?: Redis.ClusterOptions,
  ): Redis.Cluster {
    return new Redis.Cluster(nodes, options);
  }
}
