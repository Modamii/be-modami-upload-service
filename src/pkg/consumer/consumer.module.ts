import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { ConfigService } from '@nestjs/config';

import { InternalModule } from '../../internal/adapter/handler/images.module';
import { RESIZE_IMAGE } from './consumer.constant';
import { ISQSConfig } from '../configs/config.interface';
import { ImageConsumer, SQSImageMessageHandler } from './image.consumer';
import { FileConsumer } from './file.consumer';

@Module({
  imports: [
    SqsModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sqsConfig = configService.get<ISQSConfig>('sqs');

        if (!sqsConfig.enabled) {
          return { consumers: [], producers: [] };
        }

        return {
          consumers: [
            {
              name: RESIZE_IMAGE,
              queueUrl: sqsConfig.resizeImageQueueUrl,
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
  controllers: [ImageConsumer, FileConsumer],
  providers: [SQSImageMessageHandler],
  exports: [],
})
export class ConsumerModule {}
