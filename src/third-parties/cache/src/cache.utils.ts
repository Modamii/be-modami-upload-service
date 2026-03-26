import { IRedisConfig } from '../../../configs/config.interface';

export function hasCacheConfig(config: IRedisConfig): boolean {
  if (config.clusterHosts.length > 0 || (config.host && config.host != '')) {
    return true;
  }
  return false;
}
