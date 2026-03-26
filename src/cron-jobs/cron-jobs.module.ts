import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { VideosModule } from '../videos/videos.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [VideosModule, FilesModule],
  controllers: [],
  providers: [CronJobsService],
})
export class CronJobsModule {}
