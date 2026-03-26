import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { HTTP_METHODS } from '../../common/constants';
import { mockClass } from '../../common/helpers';
import { VideosController } from '../videos.controller';
import { VideosService } from '../videos.service';

const videosServiceMock = mockClass<VideosService>();
const res = createMock<Response>();
const req = createMock<Request>();
req.user = { id: '03412e52-e695-42ac-a096-034a9345c8b4' };

describe('VideosController', () => {
  let controller: VideosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [{ provide: VideosService, useValue: videosServiceMock }],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    jest.spyOn(controller, 'expose').mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    const videoId = '123';

    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.upload)).toBe(
        HTTP_METHODS.POST,
      );

      expect(Reflect.getMetadata('path', controller.upload)).toBe(':id');
    });

    it('should call service.upload', async () => {
      videosServiceMock.upload.mockResolvedValue({});

      const res = await controller.upload(
        videoId,
        {} as any,
        { uploadType: '' } as any,
        req,
      );

      expect(res).toEqual({});
      expect(videosServiceMock.upload).toBeCalledWith(user.id, videoId, {}, '');
      expect(controller.expose).toBeCalledTimes(1);
    });
  });

  describe('getKalturaRedirectUrl', () => {
    const id = '123';

    it('method and path are correct', () => {
      expect(
        Reflect.getMetadata('method', controller.getKalturaRedirectUrl),
      ).toBe(HTTP_METHODS.GET);

      expect(
        Reflect.getMetadata('path', controller.getKalturaRedirectUrl),
      ).toBe(':id/kaltura/:format');
    });

    it('should call service.getKalturaRedirectUrl', async () => {
      const url = '...';
      videosServiceMock.getKalturaRedirectUrl.mockResolvedValue(url);
      res.setHeader.mockReturnValue(res);
      res.json.mockReturnValue(res);

      await controller.getKalturaRedirectUrl(id, 'hls', res);

      expect(res.setHeader).toBeCalledWith('X-Accel-Redirect', url);
      expect(res.json).toBeCalledWith({});
      expect(videosServiceMock.getKalturaRedirectUrl).toBeCalledTimes(1);
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
      videosServiceMock.create.mockResolvedValue({});

      await controller.create(req);

      expect(videosServiceMock.create).toBeCalledWith(user.id);
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
      videosServiceMock.gets.mockResolvedValue({});

      await controller.gets();

      expect(videosServiceMock.gets).toBeCalledTimes(1);
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
      videosServiceMock.getById.mockResolvedValue({});

      const res = await controller.getById('1');

      expect(res).toEqual({});
      expect(videosServiceMock.getById).toBeCalledWith('1');
      expect(controller.expose).toBeCalledTimes(1);
    });
  });

  describe('processing', () => {
    it('method and path are correct', () => {
      expect(Reflect.getMetadata('method', controller.processing)).toBe(
        HTTP_METHODS.POST,
      );

      expect(Reflect.getMetadata('path', controller.processing)).toBe(
        ':id/processing',
      );
    });

    it('should call service.processing', async () => {
      videosServiceMock.processing.mockResolvedValue({});

      await controller.processing('1');

      expect(videosServiceMock.processing).toBeCalledWith('1');
    });
  });
});
