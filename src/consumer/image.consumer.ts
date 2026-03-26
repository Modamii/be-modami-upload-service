import { Controller, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { ImagesService } from '../images/images.service';
import { RESIZE_IMAGE } from './consumer.constant';

@Controller()
export class ImageConsumer {
  logger = new Logger(ImageConsumer.name);
}

@Injectable()
export class SQSImageMessageHandler {
  logger = new Logger(SQSImageMessageHandler.name);
  constructor(private imagesService: ImagesService) {}

  private async _handleMessage(message: AWS.SQS.Message) {
    const requestId = createHash('md5')
      .update(JSON.stringify(message))
      .digest('hex');
    this.logger.log({
      message: 'receive event',
      event: RESIZE_IMAGE,
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
            promises.push(this.imagesService.processImage(bucket, key));
          }
        }
        await Promise.all(promises);
      }
      this.logger.debug({ message: 'handle message success', requestId });
    } catch (error) {
      this.logger.log({ message: 'handle message error', requestId, error });
    }
  }

  @SqsMessageHandler(RESIZE_IMAGE, true)
  public async handleMessageBatch(
    messages: AWS.SQS.Message[],
  ): Promise<AWS.SQS.Message[] | void> {
    const promises = messages.map((message) => this._handleMessage(message));
    await Promise.allSettled(promises);
  }

  @SqsConsumerEventHandler(RESIZE_IMAGE, 'processing_error')
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.log({ message: 'onProcessingError', error, data: message });
  }

  @SqsConsumerEventHandler(RESIZE_IMAGE, 'error')
  public onError(error: Error) {
    // https://github.com/ssut/nestjs-sqs/issues/9
    this.logger.log({ message: 'onError', error });
  }
}
