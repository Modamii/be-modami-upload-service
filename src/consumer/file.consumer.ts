import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { FilesService } from '../files/files.service';
import { EVENTS, KafkaUtility } from '../third-parties/kafka';
import {
  JobDeleteFilesDto,
  JobMarkFilesHasBeenUsedDto,
} from './dto/consumer.dto';
import { AwsS3Config } from '../configs/config.interface';

@Controller()
export class FileConsumer {
  logger = new Logger(FileConsumer.name);
  private s3Config: AwsS3Config;
  constructor(
    private filesService: FilesService,
    private configService: ConfigService,
  ) {
    this.s3Config = this.configService.get<AwsS3Config>('s3');
  }
  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.JOBS.DELETE_FILES,
      process.env.KAFKA_ENV,
    ),
  )
  public async deleteFiles(msgContent: JobDeleteFilesDto) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.JOBS.DELETE_FILES,
        data: msgContent,
      });
      await this.filesService.deleteByIds(
        msgContent.fileIds,
        msgContent.userId,
      );
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }

  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.JOBS.MARK_FILES_HAS_BEEN_USED,
      process.env.KAFKA_ENV,
    ),
  )
  public async markFilesHasBeenUsed(msgContent: JobMarkFilesHasBeenUsedDto) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.JOBS.MARK_FILES_HAS_BEEN_USED,
        data: msgContent,
      });
      await this.filesService.markFilesHasBeenUsed(
        msgContent.fileIds,
        msgContent.userId,
      );
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }
}
