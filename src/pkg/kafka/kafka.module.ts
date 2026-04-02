import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaConfig } from '../configs/config.interface';
import { KAFKA_INJECT_TOKEN } from './kafka.constant';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: KAFKA_INJECT_TOKEN,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
          const kafkaConfig = configService.get<KafkaConfig>('kafka');
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: kafkaConfig.clientID,
                brokers: kafkaConfig.brokers,
                ssl: {
                  cert: kafkaConfig.ssl.cert,
                  key: kafkaConfig.ssl.key,
                  ca: kafkaConfig.ssl.ca,
                },
                sasl: {
                  mechanism: kafkaConfig.mechanism as any,
                  username: kafkaConfig.username,
                  password: kafkaConfig.password,
                },
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
