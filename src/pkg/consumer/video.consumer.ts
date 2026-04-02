import { Controller, Injectable, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { VideoService } from '../../internal/service/video.service';
import { EVENTS, KafkaUtility } from '../kafka';
import { AwsS3Config } from '../configs/config.interface';
import { VIDEO_CONSUMER } from './consumer.constant';
import {
  JobDeleteVideosDto,
  JobMarkVideosHasBeenUsedDto,
} from './dto/consumer.dto';

@Controller()
export class VideoConsumer {
  logger = new Logger(VideoConsumer.name);
  private s3Config: AwsS3Config;
  constructor(
    private videosService: VideoService,
    private configService: ConfigService,
  ) {
    this.s3Config = this.configService.get<AwsS3Config>('s3');
  }

  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.JOBS.DELETE_VIDEOS,
      process.env.KAFKA_ENV,
    ),
  )
  public async deleteVideos(msgContent: JobDeleteVideosDto) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.JOBS.DELETE_VIDEOS,
        data: msgContent,
      });
      await this.videosService.deleteByIds(
        msgContent.videoIds,
        msgContent.userId,
      );
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }

  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.JOBS.MARK_VIDEOS_HAS_BEEN_USED,
      process.env.KAFKA_ENV,
    ),
  )
  public async markVideosHasBeenUsed(msgContent: JobMarkVideosHasBeenUsedDto) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.JOBS.MARK_VIDEOS_HAS_BEEN_USED,
        data: msgContent,
      });
      await this.videosService.markVideosHasBeenUsed(
        msgContent.videoIds,
        msgContent.userId,
      );
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }
}

@Injectable()
export class SQSVideoMessageHandler {
  logger = new Logger(SQSVideoMessageHandler.name);
  constructor(private videoService: VideoService) {}

  private async _handleMessage(message: AWS.SQS.Message) {
    const requestId = createHash('md5')
      .update(JSON.stringify(message))
      .digest('hex');
    this.logger.log({
      message: 'receive event',
      event: VIDEO_CONSUMER,
      data: message.Body,
      requestId,
    });

    try {
      const body = JSON.parse(message?.Body);
      if (body && Array.isArray(body.Records)) {
        const promises = [];
        for (const record of body.Records) {
          const bucket = record?.s3?.bucket?.name;
          const key = record?.s3?.object?.key;
          const eventName = record?.eventName;
          if (!bucket || !key || !eventName) {
            continue;
          }

          if (eventName.includes('ObjectCreated')) {
            promises.push(this.videoService.processVideo(bucket, key));
          }
        }
        await Promise.all(promises);
      }
      this.logger.debug({ message: 'handle message success', requestId });
    } catch (error) {
      this.logger.log({ message: 'handle message error', requestId, error });
    }
  }

  @SqsMessageHandler(VIDEO_CONSUMER, true)
  public async handleMessageBatch(
    messages: AWS.SQS.Message[],
  ): Promise<AWS.SQS.Message[] | void> {
    const promises = messages.map((message) => this._handleMessage(message));
    await Promise.allSettled(promises);
  }

  @SqsConsumerEventHandler(VIDEO_CONSUMER, 'processing_error')
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.log({ message: 'onProcessingError', error, data: message });
  }

  @SqsConsumerEventHandler(VIDEO_CONSUMER, 'error')
  public onError(error: Error) {
    // https://github.com/ssut/nestjs-sqs/issues/9
    this.logger.log({ message: 'onError', error });
  }
}
