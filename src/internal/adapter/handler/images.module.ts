import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../pkg/database/database.module';
import { ObjectStorageModule } from '../../../pkg/object-storage/object-storage.module';
import { KafkaModule } from '../../../pkg/kafka';

import {
  IMAGE_REPOSITORY,
  FILE_REPOSITORY,
  OBJECT_STORAGE_PORT,
  EVENT_PRODUCER_PORT,
} from '../../port/injection-tokens';
import { ImageRepository } from '../repository/image.repository';
import { FileRepository } from '../repository/file.repository';
import { ObjectStorageAdapter } from '../object-storage/object-storage.adapter';
import { KafkaEventProducerAdapter } from '../kafka/kafka-event-producer.adapter';
import { ImageService } from '../../service/image.service';
import { FileService } from '../../service/file.service';

import { ImagesPublicController } from './images.public.controller';
import { FilesPublicController } from './files.public.controller';
import { ImagesInternalController } from './images.controller';
import { FilesInternalController } from './files.controller';

@Module({
  imports: [DatabaseModule, ObjectStorageModule, KafkaModule],
  controllers: [
    ImagesPublicController,
    FilesPublicController,
    ImagesInternalController,
    FilesInternalController,
  ],
  providers: [
    ImageService,
    FileService,
    ImageRepository,
    FileRepository,
    ObjectStorageAdapter,
    KafkaEventProducerAdapter,
    { provide: IMAGE_REPOSITORY, useClass: ImageRepository },
    { provide: FILE_REPOSITORY, useClass: FileRepository },
    { provide: OBJECT_STORAGE_PORT, useClass: ObjectStorageAdapter },
    { provide: EVENT_PRODUCER_PORT, useClass: KafkaEventProducerAdapter },
  ],
  exports: [ImageService, FileService],
})
export class InternalModule {}
