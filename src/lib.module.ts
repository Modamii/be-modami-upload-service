import { Global, Module } from '@nestjs/common';
import { CacheManageModule } from './third-parties/cache/src';

@Global()
@Module({
  imports: [CacheManageModule],
  exports: [CacheManageModule],
})
export class LibModule {}
