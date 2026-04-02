import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../pkg/database/database.module';
import { ObjectStorageModule } from '../../../pkg/object-storage/object-storage.module';
import { KafkaModule } from '../../../pkg/kafka';
import { VimeoModule } from '../../../pkg/vimeo/vimeo.module';

import {
  IMAGE_REPOSITORY,
  VIDEO_REPOSITORY,
  FILE_REPOSITORY,
  OBJECT_STORAGE_PORT,
  EVENT_PRODUCER_PORT,
} from '../../port/injection-tokens';
import { ImageRepository } from '../repository/image.repository';
import { VideoRepository } from '../repository/video.repository';
import { FileRepository } from '../repository/file.repository';
import { ObjectStorageAdapter } from '../object-storage/object-storage.adapter';
import { KafkaEventProducerAdapter } from '../kafka/kafka-event-producer.adapter';
import { ImageService } from '../../service/image.service';
import { VideoService } from '../../service/video.service';
import { FileService } from '../../service/file.service';

import { ImagesPublicController } from './images.public.controller';
import { VideosPublicController } from './videos.public.controller';
import { FilesPublicController } from './files.public.controller';
import { ImagesInternalController } from './images.controller';
import { VideosInternalController } from './videos.controller';
import { FilesInternalController } from './files.controller';

@Module({
  imports: [DatabaseModule, ObjectStorageModule, KafkaModule, VimeoModule],
  controllers: [
    ImagesPublicController,
    VideosPublicController,
    FilesPublicController,
    ImagesInternalController,
    VideosInternalController,
    FilesInternalController,
  ],
  providers: [
    ImageService,
    VideoService,
    FileService,
    ImageRepository,
    VideoRepository,
    FileRepository,
    ObjectStorageAdapter,
    KafkaEventProducerAdapter,
    { provide: IMAGE_REPOSITORY, useClass: ImageRepository },
    { provide: VIDEO_REPOSITORY, useClass: VideoRepository },
    { provide: FILE_REPOSITORY, useClass: FileRepository },
    { provide: OBJECT_STORAGE_PORT, useClass: ObjectStorageAdapter },
    { provide: EVENT_PRODUCER_PORT, useClass: KafkaEventProducerAdapter },
  ],
  exports: [ImageService, VideoService, FileService],
})
export class InternalModule {}
