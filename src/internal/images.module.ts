import { Module } from '@nestjs/common';
import { VideosModule } from './../videos/videos.module';
import { ImagesModule } from '../images/images.module';
import { FilesModule } from './../files/files.module';
import { ImagesInternalController } from './images.controller';
import { VideosInternalController } from './videos.controller';
import { FilesInternalController } from './files.controller';

@Module({
  imports: [ImagesModule, VideosModule, FilesModule],
  controllers: [
    ImagesInternalController,
    VideosInternalController,
    FilesInternalController,
  ],
  providers: [],
  exports: [],
})
export class InternalModule {}
