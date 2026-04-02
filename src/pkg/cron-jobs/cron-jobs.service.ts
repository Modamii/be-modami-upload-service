import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoService } from '../../internal/service/video.service';
import { FileService } from '../../internal/service/file.service';
import { deleteOldTempFiles } from 'src/pkg/common/helpers';
import { MAX_AGE_TEMP_FILE_IN_MINUTE } from './cron-job.constant';
import { DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR } from '../common/constants';

@Injectable()
export class CronJobsService {
  constructor(
    private filesService: FileService,
    private videosService: VideoService,
  ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  private deleteFilesNotUse() {
    Logger.verbose({ message: '[Job] delete files not use' });
    this.filesService.deleteFilesNotUse(DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR);
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  private deleteVideosNotUse() {
    Logger.verbose({ message: '[Job] delete videos not use' });
    this.videosService.deleteVideosNotUse(DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR);
  }

  @Cron(CronExpression.EVERY_HOUR)
  private deleteOldTempFiles() {
    Logger.verbose({ message: '[Job] delete old temp files' });
    deleteOldTempFiles(MAX_AGE_TEMP_FILE_IN_MINUTE);
  }
}
