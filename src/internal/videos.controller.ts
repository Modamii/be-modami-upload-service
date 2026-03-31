import { Controller, Post, Body, Logger, Version } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../common/base';
import { VideoDto } from '../videos/dto';
import { VideosService } from '../videos/videos.service';
import { ROUTES } from 'src/common/constants';

@ApiTags('Internal')
@Controller()
export class VideosInternalController extends BaseController {
  private logger: Logger;
  constructor(private readonly service: VideosService) {
    super();
    this.logger = new Logger(VideosInternalController.name);
  }

  @ApiOperation({
    summary: 'Get videos by IDs (internal)',
    description:
      'Returns video records for the given list of UUIDs, including internal fields like HLS URL. ' +
      'Also marks videos as used when first retrieved.',
  })
  @ApiBody({
    description: 'Array of video UUIDs',
    type: [String],
    examples: {
      example: {
        value: ['550e8400-e29b-41d4-a716-446655440000'],
      },
    },
  })
  @ApiOkResponse({
    description: 'List of video records (with internal fields including hlsUrl)',
    type: [VideoDto],
  })
  @Post(ROUTES.INTERNAL.VIDEO.GET_BY_IDS.PATH)
  @Version(ROUTES.INTERNAL.VIDEO.GET_BY_IDS.VERSIONS)
  async getByIds(@Body() ids: string[]) {
    const videos = await this.service.getByIds(ids);

    // Mark video used
    const videoIds = videos
      .filter((video) => !video.isUse && !video.deletedAt && video.originUrl)
      .map((video) => video.id);
    if (videoIds.length > 0) {
      this.service.markVideosHasBeenUsed(videoIds).catch((err) => {
        this.logger.warn({
          message: 'mark video used error',
          error: err,
          videoIds: videoIds,
        });
      });
    }

    return this.expose(VideoDto, videos, { groups: ['get_internal'] });
  }
}
