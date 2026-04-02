import { HealthController } from './health.controller';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { KafkaHealthIndicator, RedisHealthIndicator } from './indicators';
import { HealthService } from './health.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [KafkaHealthIndicator, RedisHealthIndicator, HealthService],
})
export class HealthModule {}
