import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { VideoDatabaseModule } from '../database/database.module';
import { VimeoModule } from '../vimeo/vimeo.module';
import { KafkaModule } from '../third-parties/kafka';
import { VideosRepository } from './videos.repository';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

@Module({
  imports: [VideoDatabaseModule, KafkaModule, VimeoModule, ObjectStorageModule],
  controllers: [VideosController],
  providers: [VideosService, VideosRepository],
  exports: [VideosService],
})
export class VideosModule {}
