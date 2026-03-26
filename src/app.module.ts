import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  ApiVersioningMiddleware,
  AuthMiddleware,
  AuthModule,
  WHITELIST_PATH,
} from './auth';
import config from './configs/config';
import { ConsumerModule } from './consumer/consumer.module';
import { CronJobsModule } from './cron-jobs/cron-jobs.module';
import {
  FileDatabaseModule,
  VideoDatabaseModule,
} from './database/database.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { ImagesModule } from './images/images.module';
import { InternalModule } from './internal/images.module';
import { LibModule } from './lib.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { KafkaModule } from './third-parties/kafka';
import { I18nGlobalModule } from './translate/i18n-global.module';
import { VideosModule } from './videos/videos.module';
import { VimeoModule } from './vimeo/vimeo.module';

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
    VideoDatabaseModule,
    FileDatabaseModule,
    AuthModule,
    KafkaModule,
    ConsumerModule,
    ObjectStorageModule,
    VimeoModule,
    VideosModule,
    FilesModule,
    ImagesModule,
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
      .forRoutes('*')
      .apply(AuthMiddleware)
      .exclude(...WHITELIST_PATH)
      .forRoutes('*');
  }
}
