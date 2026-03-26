import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Version,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';

import { BaseController } from '../common/base';
import { VideoUploadDto } from '../common/dto';
import { Exception, EXCEPTIONS } from '../common/exceptions';
import { AppHelper, getUploadTempPath } from '../common/helpers';
import {
  CreateVideoDto,
  CreateVideoResponseDto,
  GetVideoQueryDto,
  VideoDto,
  VideoMimetype,
} from './dto';
import { VideosService } from './videos.service';
import { AuthUser } from '../auth';
import { ROUTES, VERSION_1_0_0, VERSION_2_0_0 } from 'src/common/constants';
import { UserDto } from 'src/auth/dto';

@ApiSecurity('authorization')
@ApiTags('Videos')
@Controller()
export class VideosController extends BaseController {
  constructor(private readonly videoService: VideosService) {
    super();
  }

  @ApiOperation({
    summary: 'Create video id v2',
    description: 'Create video id and presigned url',
  })
  @ApiOkResponse({
    description: 'Create video id v2 successful',
    type: CreateVideoResponseDto,
  })
  @Post(ROUTES.VIDEO.CREATE.PATH)
  @Version(AppHelper.getVersionsSupportedFrom(VERSION_2_0_0))
  async createVideoV2(@AuthUser() user: UserDto, @Body() body: CreateVideoDto) {
    if (!body.properties) {
      body.properties = { mimeType: VideoMimetype.mp4 };
    }
    const video = await this.videoService.createV2(user.id, body);
    return this.expose(CreateVideoResponseDto, video, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'Create video id',
    description: '',
  })
  @ApiOkResponse({
    description: 'Create video id successful',
    type: VideoDto,
  })
  @Post(ROUTES.VIDEO.CREATE.PATH)
  @Version(AppHelper.getVersionsSupportedTo(VERSION_1_0_0))
  async create(@AuthUser() user: UserDto) {
    const video = await this.videoService.create(user.id);
    return this.expose(VideoDto, video, { groups: ['create'] });
  }

  @ApiOperation({
    summary: 'Get, filter videos',
    description: '',
  })
  @ApiOkResponse({
    type: VideoDto,
  })
  @Get(ROUTES.VIDEO.GET_VIDEOS.PATH)
  @Version(ROUTES.VIDEO.GET_VIDEOS.VERSIONS)
  async gets() {
    const videos = await this.videoService.gets();
    return this.expose(VideoDto, videos, { groups: ['gets'] });
  }

  @ApiOperation({
    summary: 'Get video by id',
    description: '',
  })
  @ApiOkResponse({
    type: VideoDto,
  })
  @Get(ROUTES.VIDEO.GET_DETAIL.PATH)
  @Version(ROUTES.VIDEO.GET_DETAIL.VERSIONS)
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetVideoQueryDto,
  ) {
    let video: VideoDto;
    if (query?.wait) {
      video = await this.videoService.getAndWaitFinish(id);
    } else {
      video = await this.videoService.getById(id);
    }
    delete video.originUrl;
    return this.expose(VideoDto, video, { groups: ['get'] });
  }

  @ApiOperation({
    summary: 'Get video by ids',
    description: '',
  })
  @ApiOkResponse({
    type: VideoDto,
  })
  @Post(ROUTES.VIDEO.GET_BY_IDS.PATH)
  @Version(ROUTES.VIDEO.GET_BY_IDS.VERSIONS)
  async getByIds(@AuthUser() user: UserDto, @Body() ids: string[]) {
    const videos = await this.videoService.getByIds(ids, user.id);
    return this.expose(VideoDto, videos, { groups: ['gets'] });
  }

  @ApiOperation({
    summary: 'Upload video',
    description: '',
  })
  @ApiOkResponse({
    description: 'Upload video successful',
    type: VideoDto,
  })
  @ApiBody({
    description: 'Upload',
    type: VideoUploadDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    // https://stackoverflow.com/questions/49096068/upload-file-using-nestjs-and-multer
    FileInterceptor('file', {
      limits: {
        fileSize:
          (parseInt(process.env.MAX_VIDEO_SIZE_IN_MB) || 100) * 1024 * 1024,
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/(video)/)) {
          return cb(
            new Exception(EXCEPTIONS.COMMON.BAD_REQUEST).withFields({
              message: `Unsupported mimetype ${file.mimetype}`,
            }),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: getUploadTempPath(),
        filename: (req, file, cb) => {
          const rx =
            /videos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;
          const videoId = rx.exec(req.url)[1];
          // set file.filename = videoId
          cb(null, videoId);
        },
      }),
    }),
  )
  @Post(ROUTES.VIDEO.UPLOAD.PATH)
  @Version(ROUTES.VIDEO.UPLOAD.VERSIONS)
  public async upload(
    @Param('id', ParseUUIDPipe) videoId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() upload: VideoUploadDto,
    @AuthUser() user: UserDto,
  ): Promise<any> {
    const video = await this.videoService.upload(
      user.id,
      videoId,
      file,
      upload.uploadType,
    );
    return this.expose(VideoDto, video, { groups: ['upload'] });
  }

  @ApiOperation({
    summary: 'Get kaltura url. (internal)',
    description: 'use redirect internal nginx',
  })
  @Get(ROUTES.VIDEO.GET_KATURA_REDIRECT_URL.PATH)
  @Version(ROUTES.VIDEO.GET_KATURA_REDIRECT_URL.VERSIONS)
  async getKalturaRedirectUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    const url = await this.videoService.getKalturaRedirectUrl(id, format);
    res.setHeader('X-Accel-Redirect', url);
    res.json({});
  }

  @ApiOperation({
    summary: 'Processing video, test only. (internal)',
    description: '',
  })
  @Post(ROUTES.VIDEO.PROCESSING.PATH)
  @Version(ROUTES.VIDEO.PROCESSING.VERSIONS)
  processing(@Param('id', ParseUUIDPipe) id: string) {
    this.videoService.processing(id).catch((e) => e);
  }
}
