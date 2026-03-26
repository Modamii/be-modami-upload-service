import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';

import { ObjectStorageService } from '../object-storage.service';
import { mockClass, VideoHelper, deleteFile } from '../../common/helpers';

import { S3_ACL } from '../../videos/videos.constant';
import { VideoUploadType } from '../../common/dto';
import { DELETE_OBJECT_BULK_SIZE_IN_NUMBER } from '../object-storage.constant';

const configServiceMock = mockClass<ConfigService>();

const mS3Instance = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn(),
  getObject: jest.fn().mockReturnThis(),
  createReadStream: jest.fn(),
};
jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mS3Instance) };
});
jest.mock('../../common/helpers/file.helper.ts', () => {
  return { deleteFile: jest.fn() };
});
let videoHelperMock: VideoHelper;

describe('ObjectStorageService', () => {
  let service: ObjectStorageService;
  const userUploadVideosBucket = 'b_video';
  const userUploadImagesBucket = 'b_image';
  const userUploadFilesBucket = 'b_file';
  const size = 10;

  beforeEach(async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      switch (key) {
        case 'hlsPrefixUrl':
          return 'http://abc.com/media/';
        case 'tempPath':
          return '/tmp';
        case 's3':
          return {
            userUploadVideosBucket,
            userUploadImagesBucket,
            userUploadFilesBucket,
          };
        default:
          return {};
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ConfigService, useValue: configServiceMock },
        ObjectStorageService,
      ],
    }).compile();

    service = module.get<ObjectStorageService>(ObjectStorageService);
    videoHelperMock = VideoHelper as jest.MockedClass<typeof VideoHelper>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadToS3', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'uploadToS3').mockRestore();
    });
    const bucket = 'test bucket';
    const mp4Path = '/tmp/abc.mp4';
    const s3Key = '/post/origin/abc.mp4';
    const err = new Error('err...');
    const url =
      'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/origin/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073.mp4';

    it('should ok', async () => {
      const mockedReadStream = { close: jest.fn() };
      jest
        .spyOn(fs, 'createReadStream')
        .mockReturnValue(mockedReadStream as any);
      mS3Instance.promise.mockResolvedValue({
        Location: url,
      });

      jest.spyOn(fs, 'statSync').mockReturnValue({ size } as any);

      const { src } = await service['uploadToS3'](bucket, mp4Path, s3Key);
      expect(src).toEqual(url);
      expect(mS3Instance.promise).toBeCalledTimes(1);
      expect(mS3Instance.upload).toBeCalledWith({
        Bucket: bucket,
        Body: mockedReadStream,
        Key: s3Key,
        ACL: S3_ACL,
        ContentLength: size,
      });
      expect(mockedReadStream.close).toBeCalledTimes(1);
    });

    it('should throw error', async () => {
      const mockedReadStream = { close: jest.fn() };
      jest
        .spyOn(fs, 'createReadStream')
        .mockReturnValue(mockedReadStream as any);
      mS3Instance.promise.mockRejectedValue(err);

      expect(service['uploadToS3'](bucket, mp4Path, s3Key)).rejects.toThrow(
        err,
      );
    });
  });

  describe('upload video, image, file to S3', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'uploadToS3').mockRestore();
    });
    const fullPath = '/tmp/abc...';
    const originalName = '123.log';
    const s3Key = '/../origin/abc...';
    const videoId = 'a850b96b-ce54-45e9-917d-53f156dd27ae';
    const uploadType = VideoUploadType.postVideo;

    it('should ok', async () => {
      jest
        .spyOn(service as any, 'uploadToS3')
        .mockResolvedValue({ src: '...' });

      videoHelperMock['getOriginVideoS3Key'] = jest.fn().mockReturnValue(s3Key);

      service.uploadOriginVideo(fullPath, videoId, originalName, uploadType);
      service.uploadImageToS3(fullPath, s3Key);
      service.uploadFileToS3(fullPath, s3Key, originalName);
      expect(service['uploadToS3']).toBeCalledWith(
        configServiceMock.get('s3').userUploadVideosBucket,
        fullPath,
        s3Key,
      );
      expect(service['uploadToS3']).toBeCalledWith(
        configServiceMock.get('s3').userUploadImagesBucket,
        fullPath,
        s3Key,
      );
      expect(service['uploadToS3']).toBeCalledWith(
        configServiceMock.get('s3').userUploadFilesBucket,
        fullPath,
        s3Key,
        originalName,
      );
    });

    it('should ok', async () => {
      jest
        .spyOn(service as any, 'uploadToS3')
        .mockResolvedValue({ src: '...' });

      service.uploadThumbnailToS3(fullPath, s3Key);
      expect(service['uploadToS3']).toBeCalledWith(
        configServiceMock.get('s3').userUploadVideosBucket,
        fullPath,
        s3Key,
      );
    });
  });

  describe('uploadVariantVideo', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'uploadToS3').mockRestore();
    });
    const s3Key = '/../origin/abc...';
    const videoId = 'a850b96b-ce54-45e9-917d-53f156dd27ae';
    const remoteUrl = 'https://remote....';
    const quality = '720p';
    const err = new Error('err...');

    it('should ok', async () => {
      jest
        .spyOn(service as any, 'uploadToS3')
        .mockResolvedValue({ src: '...' });

      videoHelperMock['downloadRemoteVideo'] = jest.fn().mockResolvedValue({});
      videoHelperMock['getTranscodedS3Key'] = jest.fn().mockReturnValue(s3Key);

      const res = await service.uploadVariantVideo(remoteUrl, videoId, quality);
      expect(res).toEqual({ src: '...' });
      expect(service['uploadToS3']).toBeCalledWith(
        configServiceMock.get('s3').userUploadVideosBucket,
        expect.any(String),
        s3Key,
      );
      expect(deleteFile).toBeCalledTimes(1);
    });

    it('should throw error', async () => {
      jest
        .spyOn(service as any, 'uploadToS3')
        .mockResolvedValue({ src: '...' });

      videoHelperMock['downloadRemoteVideo'] = jest.fn().mockRejectedValue(err);
      try {
        await service.uploadVariantVideo(remoteUrl, videoId, quality);
      } catch (error) {
        expect(error).toEqual(err);
        expect(deleteFile).toBeCalledTimes(1);
      }
    });
  });

  describe('downloadVideoFromS3', () => {
    beforeEach(() => {
      jest.spyOn(service, 'downloadVideoFromS3').mockRestore();
    });
    const mp4Path = '/tmp/abc.mp4';
    const s3Key = '/post/origin/abc.mp4';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      const mockedReadStream = {
        on: jest.fn().mockImplementation(function (this, event, handler) {
          if (event === 'close') {
            handler();
          }
          return this;
        }),
        emit: jest.fn(),
        pipe: jest.fn().mockReturnThis(),
      };
      mS3Instance.createReadStream.mockReturnValue(mockedReadStream as any);
      await service.downloadVideoFromS3(s3Key, mp4Path);
      expect(mS3Instance.createReadStream).toBeCalledTimes(1);
      expect(mS3Instance.getObject).toBeCalledWith({
        Bucket: userUploadVideosBucket,
        Key: s3Key,
      });
    });

    it('should throw error', async () => {
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      const mockedReadStream = {
        on: jest.fn().mockImplementation(function (this, event, handler) {
          if (event === 'error') {
            handler(err);
          }
          return this;
        }),
        emit: jest.fn(),
        pipe: jest.fn().mockReturnThis(),
      };
      mS3Instance.createReadStream.mockReturnValue(mockedReadStream as any);
      try {
        await service.downloadVideoFromS3(s3Key, mp4Path);
      } catch (error) {
        expect(mS3Instance.createReadStream).toBeCalledTimes(1);
        expect(mS3Instance.getObject).toBeCalledWith({
          Bucket: userUploadVideosBucket,
          Key: s3Key,
        });
        expect(error).toEqual(err);
      }
    });
  });

  // describe('bulkDeleteObjects', () => {
  //   const err = new Error('err...');
  //   const bucket = 'bucket';
  //   const urls = Array.from(
  //     new Array(5 * DELETE_OBJECT_BULK_SIZE_IN_NUMBER + 1),
  //     (val, index) => 'some string ' + index,
  //   );

  //   it('should ok', async () => {
  //     jest.spyOn(service as any, 'deleteObjects').mockResolvedValue({});

  //     await service['bulkDeleteObjects'](bucket, urls);
  //     expect(service['deleteObjects']).toBeCalledTimes(6);
  //   });

  //   it('should throw error', async () => {
  //     jest.spyOn(service as any, 'deleteObjects').mockRejectedValue(err);
  //     try {
  //       await service['bulkDeleteObjects'](bucket, urls);
  //     } catch (error) {
  //       expect(error).toEqual(err);
  //     }
  //   });
  // });
});
