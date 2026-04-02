import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../../pkg/kafka/kafka.service';
import { IEventProducerPort } from '../../port/event-producer.port';

@Injectable()
export class KafkaEventProducerAdapter implements IEventProducerPort {
  constructor(private readonly kafkaService: KafkaService) {}

  async public<T>(event: string, payload: T): Promise<void> {
    await this.kafkaService.public(event, payload);
  }
}
