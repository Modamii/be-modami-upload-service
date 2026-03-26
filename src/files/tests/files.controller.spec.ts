import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { HTTP_METHODS } from '../../common/constants';
import { mockClass } from '../../common/helpers';
import { FilesController } from '../files.controller';
import { FilesService } from '../files.service';

const filesServiceMock = mockClass<FilesService>();
const req = createMock<Request>();
req.user = { id: '03412e52-e695-42ac-a096-034a9345c8b4' };

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: filesServiceMock }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    jest.spyOn(controller, 'expose').mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    const id = '123';

    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.upload)).toBe(
        HTTP_METHODS.POST,
      );

      expect(Reflect.getMetadata('path', controller.upload)).toBe(':id');
    });

    it('should call service.uploadVideo', async () => {
      filesServiceMock.upload.mockResolvedValue({});

      const res = await controller.upload(
        id,
        {} as any,
        { uploadType: '' } as any,
        req,
      );

      expect(res).toEqual({});
      expect(filesServiceMock.upload).toBeCalledWith(user.id, id, {}, '');
      expect(controller.expose).toBeCalledTimes(1);
    });
  });

  describe('create', () => {
    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.create)).toBe(
        HTTP_METHODS.POST,
      );

      expect(Reflect.getMetadata('path', controller.create)).toBe('/');
    });

    it('should call service.create', async () => {
      filesServiceMock.create.mockResolvedValue({});

      await controller.create(req);

      expect(filesServiceMock.create).toBeCalledWith(user.id);
      expect(controller.expose).toBeCalledTimes(1);
    });
  });

  describe('gets', () => {
    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.gets)).toBe(
        HTTP_METHODS.GET,
      );

      expect(Reflect.getMetadata('path', controller.gets)).toBe('/');
    });

    it('should call service.gets', async () => {
      filesServiceMock.gets.mockResolvedValue({});

      await controller.gets();

      expect(filesServiceMock.gets).toBeCalledTimes(1);
      expect(controller.expose).toBeCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.getById)).toBe(
        HTTP_METHODS.GET,
      );

      expect(Reflect.getMetadata('path', controller.getById)).toBe(':id');
    });

    it('should call service.getById', async () => {
      filesServiceMock.getById.mockResolvedValue({});

      const res = await controller.getById('1');

      expect(res).toEqual({});
      expect(filesServiceMock.getById).toBeCalledWith('1');
      expect(controller.expose).toBeCalledTimes(1);
    });
  });
});
