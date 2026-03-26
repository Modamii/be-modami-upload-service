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
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
    summary: 'Create image id',
    description: 'Create image id and presigned url',
  })
  @ApiOkResponse({
    description: 'Create image id successful',
    type: CreateImageInternalDto,
  })
  @Post(ROUTES.INTERNAL.IMAGE.CREATE.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.CREATE.VERSIONS)
  async create(@Body() body: CreateImageInternalDto) {
    const image = await this.service.create(body.userId, body);
    return this.expose(CreateImageResponseDto, image, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'delete image by id',
    description:
      'delete image by id, this API will delete record in DB, files in s3',
  })
  @ApiOkResponse({})
  @Delete(ROUTES.INTERNAL.IMAGE.DELETE.PATH)
  @Version(ROUTES.INTERNAL.IMAGE.DELETE.VERSIONS)
  async deleteById(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.deleteByIds([id]);
    return '';
  }

  @ApiOperation({
    summary: 'Get image by ids',
    description: '',
  })
  @ApiOkResponse({
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
    summary: 'Update image (Only use to migrate data)',
    description: 'Only use to migrate data',
  })
  @ApiOkResponse({
    type: [ImageDto],
  })
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
    summary: 'Copy image (Only use to migrate data)',
    description: 'Only use to migrate data',
  })
  @ApiOkResponse({
    type: [ImageDto],
  })
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
