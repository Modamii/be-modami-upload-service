import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Version,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CreateImageResponseDto, GetImageQueryDto } from './dto/image.dto';

import { AuthUser, PRIVATE_OPS_PATH } from '../auth';
import { BaseController } from '../common/base';
import { CreateImageDto, ImageDto } from './dto';
import { ImagesService } from './images.service';
import { ROUTES } from 'src/common/constants';
import { UserDto } from 'src/auth/dto';

@ApiSecurity('authorization')
@ApiTags('Images')
@Controller(['images', `${PRIVATE_OPS_PATH}/images`])
export class ImagesController extends BaseController {
  constructor(private readonly imageService: ImagesService) {
    super();
  }

  @ApiOperation({
    summary: 'Create image id',
    description: 'Create image id and presigned url',
  })
  @ApiOkResponse({
    description: 'Create image id successful',
    type: CreateImageResponseDto,
  })
  @Post(ROUTES.IMAGE.CREATE.PATH)
  @Version(ROUTES.IMAGE.CREATE.VERSIONS)
  async create(@AuthUser() user: UserDto, @Body() body: CreateImageDto) {
    const image = await this.imageService.create(user.id, body);
    return this.expose(CreateImageResponseDto, image, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'Get, filter images',
    description: '',
  })
  @ApiOkResponse({
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
    summary: 'Get image by id',
    description: '',
  })
  @ApiOkResponse({
    type: ImageDto,
  })
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
    summary: 'Get image by ids',
    description: '',
  })
  @ApiOkResponse({
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
}
