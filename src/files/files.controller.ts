import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Version,
  Post,
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
import { diskStorage } from 'multer';

import { BaseController } from '../common/base';
import { Exception, EXCEPTIONS } from '../common/exceptions';
import { getUploadTempPath } from '../common/helpers';
import { FilesService } from './files.service';

import { AuthUser } from '../auth';
import { UploadFileDto } from '../common/dto';
import { FileDto } from './dto';
import { ROUTES } from 'src/common/constants';
import { WHILE_LIST_MIME_TYPE } from './files.constant';
import { UserDto } from 'src/auth/dto';

@ApiSecurity('authorization')
@ApiTags('Files')
@Controller()
export class FilesController extends BaseController {
  constructor(private readonly service: FilesService) {
    super();
  }

  @ApiOperation({
    summary: 'Create file id',
    description: '',
  })
  @ApiOkResponse({
    description: 'Create file id successful',
    type: FileDto,
  })
  @Post(ROUTES.FILE.CREATE.PATH)
  @Version(ROUTES.FILE.CREATE.VERSIONS)
  async create(@AuthUser() user: UserDto) {
    const file = await this.service.create(user.id);
    return this.expose(FileDto, file, {
      groups: ['create'],
    });
  }

  @ApiOperation({
    summary: 'Get, filter files',
    description: '',
  })
  @ApiOkResponse({
    type: [FileDto],
  })
  @Get(ROUTES.FILE.GET_FILES.PATH)
  @Version(ROUTES.FILE.GET_FILES.VERSIONS)
  async gets() {
    const files = await this.service.gets();
    return this.expose(FileDto, files, {
      groups: ['gets'],
    });
  }

  @ApiOperation({
    summary: 'Get file by id',
    description: '',
  })
  @ApiOkResponse({
    type: FileDto,
  })
  @Get(ROUTES.FILE.GET_DETAIL.PATH)
  @Version(ROUTES.FILE.GET_DETAIL.VERSIONS)
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const file = await this.service.getById(id);
    return this.expose(FileDto, file, {
      groups: ['get'],
    });
  }

  @ApiOperation({
    summary: 'Get file by ids',
    description: '',
  })
  @ApiOkResponse({
    type: [FileDto],
  })
  @Post(ROUTES.FILE.GET_BY_IDS.PATH)
  @Version(ROUTES.FILE.GET_BY_IDS.VERSIONS)
  async getByIds(@AuthUser() user: UserDto, @Body() ids: string[]) {
    const files = await this.service.getByIds(ids, user.id);
    return this.expose(FileDto, files, {
      groups: ['gets'],
    });
  }

  @ApiOperation({
    summary: 'Upload file',
    description: '',
  })
  @ApiBody({
    description: 'Upload',
    type: UploadFileDto,
  })
  @ApiOkResponse({
    type: FileDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    // https://stackoverflow.com/questions/49096068/upload-file-using-nestjs-and-multer
    FileInterceptor('file', {
      limits: {
        fileSize:
          (parseInt(process.env.MAX_FILE_SIZE_IN_MB) || 100) * 1024 * 1024,
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (!WHILE_LIST_MIME_TYPE.includes(file.mimetype)) {
          return cb(
            new Exception(EXCEPTIONS.COMMON.BAD_REQUEST).withFields({
              message: `Unsupported mimetype ${file.mimetype}`,
            }),
            false,
          );
        }
        // https://github.com/expressjs/multer/issues/1055
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
          'utf8',
        );
        cb(null, true);
      },
      storage: diskStorage({
        destination: getUploadTempPath(),
        filename: (req, file, cb) => {
          const rx =
            /files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;
          const id = rx.exec(req.url)[1];
          // set file.filename = id
          cb(null, id);
        },
      }),
    }),
  )
  @Post(ROUTES.FILE.UPLOAD.PATH)
  @Version(ROUTES.FILE.UPLOAD.VERSIONS)
  async upload(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() upload: UploadFileDto,
    @AuthUser() user: UserDto,
  ): Promise<any> {
    const res = await this.service.upload(user.id, id, file, upload.uploadType);
    return this.expose(FileDto, res, {
      groups: ['upload'],
    });
  }
}
