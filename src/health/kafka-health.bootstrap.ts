import { INestApplication } from '@nestjs/common';
import { KafkaHealthIndicator } from './indicators';
import { ServerKafka } from '@nestjs/microservices';

export class KafkaHealthBootstrap {
  public static init(app: INestApplication): void {
    const kafkaHealthIndicator = app.get(KafkaHealthIndicator);
    if (kafkaHealthIndicator) {
      const microservices = app.getMicroservices();
      for (const microservice of microservices) {
        if (microservice['server'] instanceof ServerKafka) {
          kafkaHealthIndicator.startCheck(microservice['server']['consumer']);
          return;
        }
      }
    }
  }
}
