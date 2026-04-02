import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { ConfigService } from '@nestjs/config';

import { PostConsumer } from './post.consumer';
import { InternalModule } from '../../internal/adapter/handler/images.module';
import { RESIZE_IMAGE, VIDEO_CONSUMER } from './consumer.constant';
import { ISQSConfig } from '../configs/config.interface';
import { ImageConsumer, SQSImageMessageHandler } from './image.consumer';
import { SQSVideoMessageHandler, VideoConsumer } from './video.consumer';
import { FileConsumer } from './file.consumer';

@Module({
  imports: [
    SqsModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sqsConfig = configService.get<ISQSConfig>('sqs');
        return {
          consumers: [
            {
              name: RESIZE_IMAGE,
              queueUrl: sqsConfig.resizeImageQueueUrl,
              batchSize: 3,
              handleMessageTimeout: 25000,
              visibilityTimeout: 30,
            },
            {
              name: VIDEO_CONSUMER,
              queueUrl: sqsConfig.videoQueueUrl,
              batchSize: 3,
              handleMessageTimeout: 25000,
              visibilityTimeout: 30,
            },
          ],
          producers: [],
        };
      },
    }),
    InternalModule,
  ],
  controllers: [PostConsumer, ImageConsumer, VideoConsumer, FileConsumer],
  providers: [SQSImageMessageHandler, SQSVideoMessageHandler],
  exports: [],
})
export class ConsumerModule {}
