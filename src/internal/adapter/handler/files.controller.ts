import { Controller, Post, Body, Logger, Version } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../../../pkg/common/base';
import { FileDto } from '../../domain/file.domain';
import { FileService } from '../../service/file.service';
import { ROUTES } from 'src/pkg/common/constants';

@ApiTags('Internal')
@Controller()
export class FilesInternalController extends BaseController {
  private logger: Logger;
  constructor(private readonly service: FileService) {
    super();
    this.logger = new Logger(FilesInternalController.name);
  }

  @ApiOperation({
    summary: 'Get files by IDs (internal)',
    description:
      'Returns file records for the given list of UUIDs. ' +
      'Also marks files as used when first retrieved.',
  })
  @ApiBody({
    description: 'Array of file UUIDs',
    type: [String],
    examples: {
      example: {
        value: ['550e8400-e29b-41d4-a716-446655440000'],
      },
    },
  })
  @ApiOkResponse({
    description: 'List of file records',
    type: [FileDto],
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
