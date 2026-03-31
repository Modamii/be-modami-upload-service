import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  Version,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { BaseController } from '../common/base';
import { ImagesService } from '../images/images.service';
import {
  ChangeImageResourceDto,
  CopyImageDto,
  CreateImageInternalDto,
  CreateImageResponseDto,
  ImageDto,
} from '../images/dto';
import { ROUTES } from 'src/common/constants';

@ApiTags('Internal')
@Controller()
export class ImagesInternalController extends BaseController {
  constructor(private readonly service: ImagesService) {
    super();
  }

  @ApiOperation({
    summary: 'Create image record (internal)',
    description:
      'Internal endpoint for server-to-server calls. Creates an image record on behalf of a user ' +
      'and returns a presigned upload URL.',
  })
  @ApiOkResponse({
    description: 'Image record created. Use presigned_url or presigned_post to upload the file.',
    type: CreateImageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid body or unsupported mime type' })
  @Post(ROUTES.INTERNAL.IMAGE.CREATE.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.CREATE.VERSIONS)
  async create(@Body() body: CreateImageInternalDto) {
    const image = await this.service.create(body.userId, body);
    return this.expose(CreateImageResponseDto, image, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'Delete image by ID (internal)',
    description: 'Permanently deletes the image record from the database and the file from MinIO.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the image to delete',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ description: 'Image deleted successfully' })
  @ApiNotFoundResponse({ description: 'Image not found' })
  @Delete(ROUTES.INTERNAL.IMAGE.DELETE.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.DELETE.VERSIONS)
  async deleteById(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.deleteByIds([id]);
    return '';
  }

  @ApiOperation({
    summary: 'Get images by IDs (internal)',
    description: 'Returns image records for the given list of UUIDs. Also exposes internal fields like presigned_url.',
  })
  @ApiBody({
    description: 'Array of image UUIDs',
    type: [String],
    examples: {
      example: {
        value: ['550e8400-e29b-41d4-a716-446655440000'],
      },
    },
  })
  @ApiOkResponse({
    description: 'List of image records (with internal fields)',
    type: [ImageDto],
  })
  @Post(ROUTES.INTERNAL.IMAGE.GET_BY_IDS.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.GET_BY_IDS.VERSIONS)
  async getByIds(@Body() ids: string[]) {
    const images = await this.service.getByIds(ids);
    // TODO change status to 200, !!! IMPORTANT notify all service use this API
    return this.expose(ImageDto, images, {
      groups: ['get', 'internal'],
    });
  }

  @ApiOperation({
    summary: 'Update image resource / owner (internal)',
    description: 'Changes the resource type or owner of an image. Intended for data migrations only.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the image to update',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Updated image record',
    type: ImageDto,
  })
  @ApiNotFoundResponse({ description: 'Image not found' })
  @Put(ROUTES.INTERNAL.IMAGE.UPDATE.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.UPDATE.VERSIONS)
  async changeResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeImageResourceDto,
  ) {
    const images = await this.service.updateImageAndResource(id, body);
    return this.expose(ImageDto, images, {
      groups: ['get'],
    });
  }

  @ApiOperation({
    summary: 'Copy image to a new resource (internal)',
    description:
      'Copies the image file in MinIO and creates a new record with the target resource type. ' +
      'Used for data migrations only.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the source image',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'New image record (copy)',
    type: ImageDto,
  })
  @ApiNotFoundResponse({ description: 'Source image not found' })
  @Post(ROUTES.INTERNAL.IMAGE.COPY.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.COPY.VERSIONS)
  async copy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CopyImageDto,
  ) {
    const images = await this.service.updateAndCloneImageIfNeed(id, body);
    return this.expose(ImageDto, images, {
      groups: ['get'],
    });
  }
}
