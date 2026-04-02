import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { InternalModule } from '../../internal/adapter/handler/images.module';

@Module({
  imports: [InternalModule],
  controllers: [],
  providers: [CronJobsService],
})
export class CronJobsModule {}
