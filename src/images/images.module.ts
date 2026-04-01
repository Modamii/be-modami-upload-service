import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ImagesRepository } from './images.repository';
import { ObjectStorageModule } from '../object-storage/object-storage.module';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';

@Module({
  imports: [DatabaseModule, ObjectStorageModule],
  controllers: [ImagesController],
  providers: [ImagesService, ImagesRepository],
  exports: [ImagesService],
})
export class ImagesModule {}
