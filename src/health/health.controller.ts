import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import {
  HealthLabel,
  HEALTH_CHECK_STORAGE_THRESHOLD_IN_BYTE,
} from './health.constants';
import { KafkaHealthIndicator, RedisHealthIndicator } from './indicators';
import { HealthService } from './health.service';
import { getUploadTempPath } from '../common/helpers';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  public constructor(
    @InjectConnection() private readonly connection: Sequelize,
    private readonly healthCheckService: HealthCheckService,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly sequelizeHealthIndicator: SequelizeHealthIndicator,
    private readonly kafkaHealthIndicator: KafkaHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 OK when the service process is running.' })
  @ApiOkResponse({ description: 'Service is alive', schema: { type: 'string', example: 'OK' } })
  @Get('livez')
  public live(): string {
    return 'OK';
  }

  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Checks all dependencies (database, Kafka, Redis, storage). ' +
      'Returns 200 when all checks pass, 503 when one or more checks fail.',
  })
  @ApiOkResponse({ description: 'All dependency checks passed' })
  @ApiServiceUnavailableResponse({ description: 'One or more dependency checks failed (database, Kafka, Redis, or storage)' })
  @Get('readyz')
  @HealthCheck()
  public async ready(): Promise<HealthCheckResult> {
    return await this.healthCheckService.check([
      async (): Promise<HealthIndicatorResult> =>
        this.memoryHealthIndicator.checkHeap(
          HealthLabel.MEMORY_HEAP_KEY,
          150 * 1024 * 1024,
        ),
      async (): Promise<HealthIndicatorResult> =>
        this.sequelizeHealthIndicator.pingCheck(HealthLabel.DATABASE_KEY, {
          connection: this.connection,
          timeout: 5000,
        }),
      async (): Promise<HealthIndicatorResult> =>
        this.kafkaHealthIndicator.isHealthy(HealthLabel.KAFKA_KEY),
      async (): Promise<HealthIndicatorResult> =>
        this.healthService.checkStorage(
          getUploadTempPath(),
          HEALTH_CHECK_STORAGE_THRESHOLD_IN_BYTE,
        ),
      async (): Promise<HealthIndicatorResult> =>
        this.redisHealthIndicator.isHealthy(HealthLabel.REDIS_KEY),
    ]);
  }
}
