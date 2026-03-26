import { ObjectStorageService } from './object-storage.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [ObjectStorageService],
  exports: [ObjectStorageService],
})
export class ObjectStorageModule {}
