import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { KafkaConfig } from '../configs/config.interface';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export class KafkaGateway {
  public static async init(
    app: INestApplication,
    configService: ConfigService,
  ) {
    const kafkaConfig = configService.get<KafkaConfig>('kafka');

    app.connectMicroservice<KafkaOptions>({
      transport: Transport.KAFKA,
      options: {
        consumer: {
          groupId: kafkaConfig.consumerGroupId,
        },
        client: {
          clientId: kafkaConfig.clientID,
          brokers: kafkaConfig.brokers,
          ssl: kafkaConfig.ssl.cert ? kafkaConfig.ssl : false,
          sasl: kafkaConfig.username
            ? {
                mechanism: kafkaConfig.mechanism as any,
                username: kafkaConfig.username,
                password: kafkaConfig.password,
              }
            : undefined,
          logLevel: logLevel.INFO,
        },
      },
    });

    Logger.log({
      message: 'Kafka Gateway initialized',
      name: KafkaGateway.name,
    });
    return app.startAllMicroservices();
  }
}
