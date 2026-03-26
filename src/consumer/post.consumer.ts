import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

import { VideosService } from '../videos/videos.service';

import { EVENTS } from '../third-parties/kafka';
import { KafkaUtility } from '../third-parties/kafka';
import { BSVideoPostHasBeenCreatedDto } from './dto/consumer.dto';

@Controller()
export class PostConsumer {
  constructor(private videosService: VideosService) {}
  logger = new Logger(PostConsumer.name);

  public async handleVideoPostHasBeenCreated(
    msgContent: BSVideoPostHasBeenCreatedDto,
  ) {
    for (const videoId of msgContent.videoIds) {
      if (msgContent.postId) {
        const video = await this.videosService.getById(videoId);
        if (!video.props) {
          video.props = {};
        }
        video.props.postId = msgContent.postId;
        await this.videosService.update(videoId, {
          props: video.props,
        });
      }
      this.videosService.processing(videoId);
    }
  }

  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.BEIN_STREAM.VIDEO_POST_HAS_BEEN_CREATED,
      process.env.KAFKA_ENV,
    ),
  )
  public async handleEventVideoPostHasBeenCreated(
    msgContent: BSVideoPostHasBeenCreatedDto,
  ) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.BEIN_STREAM.VIDEO_POST_HAS_BEEN_CREATED,
        data: msgContent,
      });
      await this.handleVideoPostHasBeenCreated(msgContent);
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }

  @EventPattern(
    KafkaUtility.getTopicFromEvent(
      EVENTS.BEIN_STREAM.RESYNC_VIDEO_POST_HAS_BEEN_CREATED,
      process.env.KAFKA_ENV,
    ),
  )
  public async handleEventResyncVideoPostHasBeenCreated(
    msgContent: BSVideoPostHasBeenCreatedDto,
  ) {
    try {
      this.logger.log({
        message: 'receive event',
        event: EVENTS.BEIN_STREAM.RESYNC_VIDEO_POST_HAS_BEEN_CREATED,
        data: msgContent,
      });
      await this.handleVideoPostHasBeenCreated(msgContent);
    } catch (error) {
      this.logger.log({ message: 'handle message error', error });
    }
  }
}
