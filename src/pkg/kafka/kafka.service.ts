import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { KafkaUtility } from './kafka.utility';

import { KafkaConfig } from '../configs/config.interface';
import { KAFKA_INJECT_TOKEN } from './kafka.constant';

@Injectable()
export class KafkaService {
  private logger = new Logger(KafkaService.name);
  private env: string;
  constructor(
    @Inject(KAFKA_INJECT_TOKEN) private kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    const kafka = this.configService.get<KafkaConfig>('kafka');
    this.env = kafka.env;
  }
  async public<T>(event: string, payload: T) {
    const topic = KafkaUtility.getTopicFromEvent(event, this.env);
    // we use lastValueFrom and await it to make sure we can catch exception that throw from emit function
    // if not use await, we can't catch exception even if there is error
    await lastValueFrom(this.kafkaClient.emit(topic, payload));

    this.logger.debug({
      message: 'published event',
      topic,
      event,
      data: payload,
    });
  }
}
