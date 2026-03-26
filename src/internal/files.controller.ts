import { Controller, Post, Body, Logger, Version } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../common/base';
import { FileDto } from '../files/dto';
import { FilesService } from '../files/files.service';
import { ROUTES } from 'src/common/constants';

@ApiTags('Internal')
@Controller()
export class FilesInternalController extends BaseController {
  private logger: Logger;
  constructor(private readonly service: FilesService) {
    super();
    this.logger = new Logger(FilesInternalController.name);
  }

  @ApiOperation({
    summary: 'Get video by ids',
    description: '',
  })
  @ApiOkResponse({
    type: FileDto,
  })
  @Post(ROUTES.INTERNAL.FILE.GET_BY_IDS.PATH)
  @Version(ROUTES.INTERNAL.FILE.GET_BY_IDS.VERSIONS)
  async getByIds(@Body() ids: string[]) {
    const files = await this.service.getByIds(ids);

    // Mark files used
    const fileIds = files
      .filter((file) => !file.isUse && !file.deletedAt && file.originUrl)
      .map((file) => file.id);
    if (fileIds.length > 0) {
      this.service.markFilesHasBeenUsed(fileIds).catch((err) => {
        this.logger.warn({
          message: 'mark file used error',
          error: err,
          fileIds: fileIds,
        });
      });
    }

    return this.expose(FileDto, files, { groups: ['get_internal'] });
  }
}
