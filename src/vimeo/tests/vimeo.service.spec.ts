import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VimeoService } from '../vimeo.service';

import { mockClass, sleep } from '../../common/helpers';

const configServiceMock = mockClass<ConfigService>();

jest.mock('../../common/helpers/file.helper.ts', () => {
  return { deleteFile: jest.fn() };
});

describe('VimeoService', () => {
  let service: VimeoService;

  beforeEach(async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      switch (key) {
        case 'hlsPrefixUrl':
          return 'http://abc.com/media/';
        case 'tempPath':
          return '/tmp';
        default:
          return {};
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ConfigService, useValue: configServiceMock },
        VimeoService,
      ],
    }).compile();

    service = module.get<VimeoService>(VimeoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addIntervalCheckTranscodeStatus', () => {
    const uploadId = 'upload_id';
    const vimeoId = 'vimeo_id';
    const err = new Error('err...');
    let objIntervalCheckStatus = {};

    beforeEach(() => {
      objIntervalCheckStatus = service['objIntervalCheckStatus'];
    });

    it('should call handle transcode done and clear old interval', async () => {
      const interval = setInterval(async (e) => {
        e;
      }, 1000);
      objIntervalCheckStatus[vimeoId] = interval;
      jest.spyOn(service, 'getTranscodeStatus').mockResolvedValue('complete');
      const handleUploadDone = jest.fn().mockResolvedValue('');
      const handleUploadError = jest.fn().mockResolvedValue('');
      service.setCallBack(handleUploadDone, handleUploadError);

      service.addIntervalCheckTranscodeStatus(uploadId, vimeoId, 0);
      await sleep(200);
      expect(handleUploadDone).toBeCalledTimes(1);
      expect(handleUploadError).toBeCalledTimes(0);
      expect(interval['_destroyed']).toEqual(true);
    });

    it('should call handle transcode error', async () => {
      jest.spyOn(service, 'getTranscodeStatus').mockResolvedValue('error');
      const handleUploadDone = jest.fn().mockResolvedValue('');
      const handleUploadError = jest.fn().mockResolvedValue('');
      service.setCallBack(handleUploadDone, handleUploadError);

      service.addIntervalCheckTranscodeStatus(uploadId, vimeoId, 0);
      await sleep(200);
      expect(handleUploadDone).toBeCalledTimes(0);
      expect(handleUploadError).toBeCalledTimes(1);
    });

    it('should call handle transcode done (getTranscodeStatus first call failed)', async () => {
      jest.spyOn(service, 'getTranscodeStatus').mockRejectedValueOnce(err);
      jest.spyOn(service, 'getTranscodeStatus').mockResolvedValue('complete');
      const handleUploadDone = jest.fn().mockResolvedValue('');
      const handleUploadError = jest.fn().mockResolvedValue('');
      service.setCallBack(handleUploadDone, handleUploadError);

      service.addIntervalCheckTranscodeStatus(uploadId, vimeoId, 0);
      await sleep(200);
      expect(handleUploadDone).toBeCalledTimes(1);
      expect(handleUploadError).toBeCalledTimes(0);
    });

    it('should call handle transcode done, transcode done throw error', async () => {
      jest.spyOn(service, 'getTranscodeStatus').mockResolvedValue('complete');
      const handleUploadDone = jest.fn().mockRejectedValue(err);
      const handleUploadError = jest.fn().mockResolvedValue('');
      service.setCallBack(handleUploadDone, handleUploadError);

      service.addIntervalCheckTranscodeStatus(uploadId, vimeoId, 0);
      await sleep(200);
      expect(handleUploadDone).toBeCalledTimes(1);
      expect(handleUploadError).toBeCalledTimes(0);
    });

    it('should call handle transcode error, transcode error throw error', async () => {
      jest.spyOn(service, 'getTranscodeStatus').mockResolvedValue('error');
      const handleUploadDone = jest.fn().mockRejectedValue(err);
      const handleUploadError = jest.fn().mockRejectedValue(err);
      service.setCallBack(handleUploadDone, handleUploadError);

      service.addIntervalCheckTranscodeStatus(uploadId, vimeoId, 0);
      await sleep(200);
      expect(handleUploadDone).toBeCalledTimes(0);
      expect(handleUploadError).toBeCalledTimes(1);
    });
  });

  describe('getTranscodeStatus', () => {
    const vimeoId = 'vimeo_id';
    const err = new Error('err...');
    const requestUrl = `https://api.vimeo.com/videos/${vimeoId}?fields=transcode.status,status`;

    it('should ok', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(null, { transcode: { status: 'complete' } }, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      const status = await service.getTranscodeStatus(vimeoId);
      expect(status).toEqual('complete');
    });

    it('should throw error', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(err, null, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.getTranscodeStatus(vimeoId)).rejects.toBeInstanceOf(Error);
    });

    it('should throw error if status != 200', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(null, null, 403);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.getTranscodeStatus(vimeoId)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('getMp4Infos', () => {
    const vimeoId = 'vimeo_id';
    const err = new Error('err...');
    const requestUrl = `https://api.vimeo.com/videos/${vimeoId}?fields=download,name`;

    it('should ok', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(null, { name: '1', download: [] }, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      const status = await service.getMp4Infos(vimeoId);
      expect(status).toEqual({
        videoId: '1',
        mp4Infos: [],
      });
    });

    it('should throw error', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(err, null, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.getMp4Infos(vimeoId)).rejects.toBeInstanceOf(Error);
    });

    it('should throw error if status != 200', async () => {
      const requestMock = jest.fn((url: string, handle: any) => {
        if (url != requestUrl) {
          throw err;
        }
        handle(null, null, 403);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.getMp4Infos(vimeoId)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('parserVideoURI', () => {
    it('should ok', async () => {
      const res = service['parserVideoURI']('videos/123');

      expect(res).toEqual({ id: '123' });
    });

    it('should ok', async () => {
      const res = service['parserVideoURI']('abcd/123');

      expect(res).toEqual({ id: null });
    });
  });

  describe('upload', () => {
    const vimeoId = '1234';
    const name = 'videoId';
    const localFilePath = '/tmp/abcd.mp4';
    const err = new Error('err...');

    it('should ok', async () => {
      const uploadMock = jest.fn(
        (
          filePath: string,
          metadata: any,
          successCb: any,
          processCb: any,
          errorCb: any,
        ) => {
          if (filePath != localFilePath) {
            throw err;
          }
          processCb(1, 1);
          successCb(`videos/${vimeoId}`);
        },
      ) as any;
      jest.spyOn(service['client'], 'upload').mockImplementation(uploadMock);

      const status = await service.upload(name, localFilePath);
      expect(status).toEqual({
        id: vimeoId,
      });
    });

    it('should throw err because upload error', async () => {
      const uploadMock = jest.fn(
        (
          filePath: string,
          metadata: any,
          successCb: any,
          processCb: any,
          errorCb: any,
        ) => {
          if (filePath != localFilePath) {
            throw err;
          }
          errorCb(err);
        },
      ) as any;
      jest.spyOn(service['client'], 'upload').mockImplementation(uploadMock);

      expect(service.upload(name, localFilePath)).rejects.toEqual(err);
    });

    it('should throw err because parser uri failed', async () => {
      const uploadMock = jest.fn(
        (
          filePath: string,
          metadata: any,
          successCb: any,
          processCb: any,
          errorCb: any,
        ) => {
          if (filePath != localFilePath) {
            throw err;
          }
          successCb(`video/${vimeoId}`);
        },
      ) as any;
      jest.spyOn(service['client'], 'upload').mockImplementation(uploadMock);

      expect(service.upload(name, localFilePath)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('delete', () => {
    const vimeoId = 'vimeo_id';
    const err = new Error('err...');

    it('should ok', async () => {
      const requestMock = jest.fn((params: { method; path }, handle: any) => {
        if (params.method != 'DELETE' || params.path != `/videos/${vimeoId}`) {
          throw err;
        }
        handle(null, {}, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      await service.delete(vimeoId);
      expect(requestMock).toBeCalledTimes(1);
    });

    it('should throw error', async () => {
      const requestMock = jest.fn((params, handle: any) => {
        if (params.method != 'DELETE' || params.path != `/videos/${vimeoId}`) {
          throw err;
        }
        handle(err, null, 200);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.delete(vimeoId)).rejects.toBeInstanceOf(Error);
    });

    it('should throw error if status != 200', async () => {
      const requestMock = jest.fn((params, handle: any) => {
        if (params.method != 'DELETE' || params.path != `/videos/${vimeoId}`) {
          throw err;
        }
        handle(null, null, 403);
      });
      jest.spyOn(service['client'], 'request').mockImplementation(requestMock);

      expect(service.delete(vimeoId)).rejects.toBeInstanceOf(Error);
    });
  });
});
