import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  ApiVersioningMiddleware,
  AuthMiddleware,
  AuthModule,
  WHITELIST_PATH,
} from './pkg/auth';
import config from './pkg/configs/config';
import { ConsumerModule } from './pkg/consumer/consumer.module';
import { CronJobsModule } from './pkg/cron-jobs/cron-jobs.module';
import { DatabaseModule } from './pkg/database/database.module';
import { HealthModule } from './pkg/health/health.module';
import { InternalModule } from './internal/adapter/handler/images.module';
import { LibModule } from './pkg/lib.module';
import { ObjectStorageModule } from './pkg/object-storage/object-storage.module';
import { KafkaModule } from './pkg/kafka';
import { I18nGlobalModule } from './pkg/translate/i18n-global.module';
import { VimeoModule } from './pkg/vimeo/vimeo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      cache: true,
      expandVariables: true,
    }),
    LibModule,
    ScheduleModule.forRoot(),
    HealthModule,
    CronJobsModule,
    DatabaseModule,
    AuthModule,
    KafkaModule,
    ConsumerModule,
    ObjectStorageModule,
    VimeoModule,
    InternalModule,
    I18nGlobalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ApiVersioningMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL })
      .apply(AuthMiddleware)
      .exclude(...WHITELIST_PATH)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
