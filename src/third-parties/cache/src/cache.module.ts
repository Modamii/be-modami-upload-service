import { Module } from '@nestjs/common';
import { CacheManageService } from './cache.service';

@Module({
  imports: [],
  providers: [CacheManageService],
  exports: [CacheManageService],
})
export class CacheManageModule {}
