import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Version,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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

import { AuthUser } from '../../../pkg/auth';
import { BaseController } from '../../../pkg/common/base';
import { ROUTES } from 'src/pkg/common/constants';
import { UserDto } from 'src/pkg/auth/dto';
import { ImageService } from '../../service/image.service';
import {
  CreateImageDto,
  CreateImageResponseDto,
  GetImageQueryDto,
  ImageDto,
} from '../../domain/image.domain';
import { UploadImageDto } from '../../dto/upload.dto';
import { getUploadTempPath } from '../../../pkg/common/helpers';
import { MAX_IMAGE_SIZE_IN_MB } from '../../domain/image.constant';

@ApiSecurity('authorization')
@ApiTags('Images')
@ApiUnauthorizedResponse({ description: 'Missing or invalid authorization token' })
@Controller('images')
export class ImagesPublicController extends BaseController {
  constructor(private readonly imageService: ImageService) {
    super();
  }

  @ApiOperation({
    summary: 'Create image record and get presigned upload URL',
    description:
      'Creates an image record in the database and returns a presigned URL and presigned POST form ' +
      'for the client to upload the file directly to MinIO. After uploading, the image is processed asynchronously.',
  })
  @ApiOkResponse({
    description: 'Image record created successfully. Use the returned presigned_url or presigned_post to upload the file.',
    type: CreateImageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body (unsupported mime type, missing fields)' })
  @Post(ROUTES.IMAGE.CREATE.PATH)
  @Version(ROUTES.IMAGE.CREATE.VERSIONS)
  async create(@AuthUser() user: UserDto, @Body() body: CreateImageDto) {
    const image = await this.imageService.create(user.id, body);
    return this.expose(CreateImageResponseDto, image, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'List all images for the authenticated user',
    description: 'Returns all image records owned by the current user.',
  })
  @ApiOkResponse({
    description: 'List of image records',
    type: [ImageDto],
  })
  @Get(ROUTES.IMAGE.GET_IMAGES.PATH)
  @Version(ROUTES.IMAGE.GET_IMAGES.VERSIONS)
  async gets() {
    const files = await this.imageService.gets();
    return this.expose(ImageDto, files, {
      groups: ['get'],
    });
  }

  @ApiOperation({
    summary: 'Get image by ID',
    description:
      'Returns a single image record by its UUID. ' +
      'Use the `wait` query parameter to block until processing is complete.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the image',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'wait',
    description: 'If true, the request blocks until image processing finishes (status becomes DONE or ERROR)',
    required: false,
    type: 'boolean',
    example: false,
  })
  @ApiOkResponse({
    description: 'Image record',
    type: ImageDto,
  })
  @ApiNotFoundResponse({ description: 'Image not found' })
  @Get(ROUTES.IMAGE.GET_DETAIL.PATH)
  @Version(ROUTES.IMAGE.GET_DETAIL.VERSIONS)
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetImageQueryDto,
  ) {
    let image: ImageDto;
    if (!query?.wait) {
      image = await this.imageService.getById(id);
    } else {
      image = await this.imageService.getAndWaitFinish(id);
    }
    return this.expose(ImageDto, image, {
      groups: ['get'],
    });
  }

  @ApiOperation({
    summary: 'Get multiple images by IDs',
    description: 'Returns an array of image records matching the provided list of UUIDs.',
  })
  @ApiBody({
    description: 'Array of image UUIDs',
    type: [String],
    examples: {
      example: {
        value: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
      },
    },
  })
  @ApiOkResponse({
    description: 'List of image records',
    type: [ImageDto],
  })
  @Post(ROUTES.IMAGE.GET_BY_IDS.PATH)
  @Version(ROUTES.IMAGE.GET_BY_IDS.VERSIONS)
  async getByIds(@AuthUser() user: UserDto, @Body() ids: string[]) {
    const files = await this.imageService.getByIds(ids, user.id);
    return this.expose(ImageDto, files, {
      groups: ['get'],
    });
  }

  @ApiOperation({
    summary: 'Upload image file (server-side)',
    description:
      'Upload an image file directly via multipart/form-data. ' +
      'The server uploads it to MinIO and triggers processing immediately. ' +
      'Use this endpoint to test the full upload flow via Swagger instead of using the presigned URL/POST.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the image record (obtained from POST /images)',
    type: 'string',
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiOkResponse({ description: 'Image uploaded and processed', type: ImageDto })
  @ApiBadRequestResponse({ description: 'File exceeds size limit or invalid format' })
  @ApiNotFoundResponse({ description: 'Image record not found' })
  @Put(ROUTES.IMAGE.UPLOAD.PATH)
  @Version(ROUTES.IMAGE.UPLOAD.VERSIONS)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_IN_MB * 1024 * 1024 },
      storage: diskStorage({
        destination: getUploadTempPath(),
        filename: (req, _file, cb) => {
          const rx =
            /images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;
          const match = rx.exec(req.url);
          const id = (match?.[1] ?? req.params.id) as string;
          cb(null, id);
        },
      }),
    }),
  )
  async upload(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() user: UserDto,
  ) {
    const image = await this.imageService.upload(user.id, id, file);
    return this.expose(ImageDto, image, { groups: ['get'] });
  }
}
