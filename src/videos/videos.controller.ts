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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
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
@ApiUnauthorizedResponse({ description: 'Missing or invalid authorization token' })
@Controller()
export class VideosController extends BaseController {
  constructor(private readonly videoService: VideosService) {
    super();
  }

  @ApiOperation({
    summary: 'Create video record and get presigned upload URL (v2+)',
    description:
      'Creates a video record and returns a presigned URL or presigned POST form for direct upload to MinIO. ' +
      'Requires `x-version-id: 2.0` or higher. After upload, video processing is triggered automatically.',
  })
  @ApiOkResponse({
    description: 'Video record created. Use presigned_url or presigned_post to upload the video file.',
    type: CreateVideoResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body (unsupported mime type)' })
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
    summary: 'Create video record (v1)',
    description:
      'Legacy endpoint (v1.0). Creates a video record without presigned POST support. ' +
      'Use v2+ for new integrations.',
  })
  @ApiOkResponse({
    description: 'Video record created successfully',
    type: VideoDto,
  })
  @Post(ROUTES.VIDEO.CREATE.PATH)
  @Version(AppHelper.getVersionsSupportedTo(VERSION_1_0_0))
  async create(@AuthUser() user: UserDto) {
    const video = await this.videoService.create(user.id);
    return this.expose(VideoDto, video, { groups: ['create'] });
  }

  @ApiOperation({
    summary: 'List all videos for the authenticated user',
    description: 'Returns all video records owned by the current user.',
  })
  @ApiOkResponse({
    description: 'List of video records',
    type: [VideoDto],
  })
  @Get(ROUTES.VIDEO.GET_VIDEOS.PATH)
  @Version(ROUTES.VIDEO.GET_VIDEOS.VERSIONS)
  async gets() {
    const videos = await this.videoService.gets();
    return this.expose(VideoDto, videos, { groups: ['gets'] });
  }

  @ApiOperation({
    summary: 'Get video by ID',
    description:
      'Returns a single video record by its UUID. ' +
      'Use the `wait` query parameter to block until processing completes.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the video',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'wait',
    description: 'If true, blocks until video processing finishes (status becomes DONE or ERROR)',
    required: false,
    type: 'boolean',
    example: false,
  })
  @ApiOkResponse({
    description: 'Video record',
    type: VideoDto,
  })
  @ApiNotFoundResponse({ description: 'Video not found' })
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
    summary: 'Get multiple videos by IDs',
    description: 'Returns an array of video records matching the provided list of UUIDs.',
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
    description: 'List of video records',
    type: [VideoDto],
  })
  @Post(ROUTES.VIDEO.GET_BY_IDS.PATH)
  @Version(ROUTES.VIDEO.GET_BY_IDS.VERSIONS)
  async getByIds(@AuthUser() user: UserDto, @Body() ids: string[]) {
    const videos = await this.videoService.getByIds(ids, user.id);
    return this.expose(VideoDto, videos, { groups: ['gets'] });
  }

  @ApiOperation({
    summary: 'Upload video file',
    description:
      'Uploads a video file directly via multipart/form-data. ' +
      'Supported formats: mp4, webm, mov, avi, mkv, flv, wmv, mpeg, m4v, 3gp, ts, hevc. ' +
      `Max size: ${parseInt(process.env.MAX_VIDEO_SIZE_IN_MB) || 100} MB.`,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the video record to attach the file to',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Video uploaded successfully; processing starts asynchronously',
    type: VideoDto,
  })
  @ApiBadRequestResponse({ description: 'Unsupported mime type or file exceeds size limit' })
  @ApiNotFoundResponse({ description: 'Video record not found' })
  @ApiBody({
    description: 'Video file upload',
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
    summary: 'Get Kaltura redirect URL (internal)',
    description: 'Returns an X-Accel-Redirect header for internal nginx proxy to Kaltura. Not for public use.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the video', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'format', description: 'Kaltura playback format', type: 'string' })
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
    summary: 'Trigger video processing (test/internal only)',
    description: 'Manually triggers the processing pipeline for a video. Use only for testing.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the video', type: 'string', format: 'uuid' })
  @Post(ROUTES.VIDEO.PROCESSING.PATH)
  @Version(ROUTES.VIDEO.PROCESSING.VERSIONS)
  processing(@Param('id', ParseUUIDPipe) id: string) {
    this.videoService.processing(id).catch((e) => e);
  }
}
