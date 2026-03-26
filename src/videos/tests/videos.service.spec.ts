import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import { VideosService } from '../videos.service';
import { KafkaService } from '../../third-parties/kafka/kafka.service';
import { ObjectStorageService } from '../../object-storage/object-storage.service';
import { VimeoService } from '../../vimeo/vimeo.service';
import { VideosRepository } from '../videos.repository';
import { UPLOAD_VIDEO_STATUS } from '../videos.constant';
import { EVENTS } from '../../third-parties/kafka';
import { VideoUploadType } from '../../common/dto';
import { Exception, EXCEPTIONS } from '../../common/exceptions';
import { ThumbnailHelper } from '../videos.helper';
import { MetadataHelper, Metadata } from '../../common/helpers/metadata.helper';

import {
  mockClass,
  deleteFile,
  getUploadTempPath,
  VideoHelper,
  sleep,
} from '../../common/helpers';

const configServiceMock = mockClass<ConfigService>();
const videosRepositoryMock = mockClass<VideosRepository>();
const kafkaServiceMock = mockClass<KafkaService>();
const vimeoServiceMock = mockClass<VimeoService>();
const objectStorageServiceMock = mockClass<ObjectStorageService>();
let metadataHelperMock: MetadataHelper;
let thumbnailHelperMock: ThumbnailHelper;
let videoHelperMock: VideoHelper;

const mS3Instance = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mS3Instance) };
});
jest.mock('../../common/helpers/file.helper.ts', () => {
  return { deleteFile: jest.fn() };
});

describe('UploadService', () => {
  let service: VideosService;

  beforeEach(async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      switch (key) {
        case 'hlsPrefixUrl':
          return 'http://abc.com/media/';
        case 'tempPath':
          return '/tmp';
        case 's3':
          return { userUploadVideosBucket: 'abcde' };
        default:
          return {};
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: VideosRepository, useValue: videosRepositoryMock },
        { provide: KafkaService, useValue: kafkaServiceMock },
        { provide: VimeoService, useValue: vimeoServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: ObjectStorageService, useValue: objectStorageServiceMock },
        VideosService,
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    metadataHelperMock = MetadataHelper as jest.MockedClass<
      typeof MetadataHelper
    >;
    thumbnailHelperMock = ThumbnailHelper as jest.MockedClass<
      typeof ThumbnailHelper
    >;
    videoHelperMock = VideoHelper as jest.MockedClass<typeof VideoHelper>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteByIds', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(service, 'validateVideosOwner').mockResolvedValue();
      videosRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteVideosInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateVideosOwner).toBeCalledWith(userId, ids);
      expect(videosRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteVideosInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok, userId = undefined', async () => {
      const userId = undefined;
      jest.spyOn(service, 'validateVideosOwner').mockResolvedValue();
      videosRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteVideosInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateVideosOwner).toBeCalledTimes(0);
      expect(videosRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteVideosInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok, userId = null', async () => {
      const userId = null;
      jest.spyOn(service, 'validateVideosOwner').mockResolvedValue();
      videosRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteVideosInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateVideosOwner).toBeCalledTimes(0);
      expect(videosRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteVideosInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok when deleteVideosInObjectStorage error', async () => {
      jest.spyOn(service, 'validateVideosOwner').mockResolvedValue();
      videosRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteVideosInObjectStorage').mockRejectedValue(err);

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateVideosOwner).toBeCalledWith(userId, ids);
      expect(videosRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteVideosInObjectStorage).toBeCalledWith(ids);
    });

    it('should throw error', async () => {
      const userId = null;
      jest.spyOn(service, 'validateVideosOwner').mockRejectedValue(err);
      videosRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteVideosInObjectStorage').mockResolvedValue();

      try {
        await service.deleteByIds(ids, userId);
      } catch (error) {
        expect(error).toEqual(err);
        expect(service.validateVideosOwner).toBeCalledTimes(1);
        expect(videosRepositoryMock.deleteByIds).toBeCalledTimes(0);
        expect(service.deleteVideosInObjectStorage).toBeCalledTimes(0);
      }
    });
  });

  describe('deleteVideosInObjectStorage', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');
    const videos = [
      {
        originUrl: 'https://1',
        thumbnails: [{ url: 'https://1.1.1' }, { url: 'https://1.1.2' }],
        files: [{ src: 'https://1.2.1' }, { src: 'https://1.2.2' }],
      },
      {
        originUrl: 'https://2',
        thumbnails: [{ url: 'https://2.1.1' }, { url: 'https://2.1.2' }],
        files: [{ src: 'https://2.2.1' }, { src: 'https://2.2.2' }],
      },
    ];

    it('should ok', async () => {
      videosRepositoryMock.getByIds.mockResolvedValue(videos);
      objectStorageServiceMock.deleteVideos.mockResolvedValue();
      objectStorageServiceMock.deleteThumbnails.mockResolvedValue();

      await service.deleteVideosInObjectStorage(ids);
      expect(videosRepositoryMock.getByIds).toBeCalledWith({
        ids,
        excludeDeleted: false,
      });
      expect(objectStorageServiceMock.deleteVideos).toBeCalledWith([
        videos[0].originUrl,
        videos[0].files[0].src,
        videos[0].files[1].src,
        videos[1].originUrl,
        videos[1].files[0].src,
        videos[1].files[1].src,
      ]);
      expect(objectStorageServiceMock.deleteThumbnails).toBeCalledWith([
        videos[0].thumbnails[0].url,
        videos[0].thumbnails[1].url,
        videos[1].thumbnails[0].url,
        videos[1].thumbnails[1].url,
      ]);
    });

    it('should throw error', async () => {
      videosRepositoryMock.getByIds.mockResolvedValue(videos);
      objectStorageServiceMock.deleteFiles.mockRejectedValue(err);

      try {
        await service.deleteVideosInObjectStorage(ids);
      } catch (error) {
        expect(error).toEqual(err);
        expect(videosRepositoryMock.getByIds).toBeCalledWith({
          ids,
          excludeDeleted: false,
        });
        expect(objectStorageServiceMock.deleteFiles).toBeCalledTimes(1);
      }
    });
  });

  describe('markVideosHasBeenUsed', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(service, 'validateVideosOwner').mockResolvedValue();
      videosRepositoryMock.markVideosHasBeenUsed.mockResolvedValue(2);

      await service.markVideosHasBeenUsed(ids, userId);

      expect(service.validateVideosOwner).toBeCalledWith(userId, ids);
      expect(videosRepositoryMock.markVideosHasBeenUsed).toBeCalledWith(ids);
    });

    it('should not check owner if !userId', async () => {
      jest.spyOn(service, 'validateVideosOwner').mockRejectedValue(err);
      videosRepositoryMock.markVideosHasBeenUsed.mockResolvedValue(2);

      await service.markVideosHasBeenUsed(ids, undefined);

      expect(service.validateVideosOwner).toBeCalledTimes(0);
      expect(videosRepositoryMock.markVideosHasBeenUsed).toBeCalledWith(ids);
    });
  });

  describe('validateVideosOwner', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(service, 'getByIds').mockResolvedValue([{}, {}] as any);

      await service.validateVideosOwner(userId, ids);
      expect(service.getByIds).toBeCalledWith(ids, userId);
    });

    it('should throw error if any file id no permission', async () => {
      jest.spyOn(service, 'getByIds').mockResolvedValue([{}] as any);
      try {
        await service.validateVideosOwner(userId, ids);
      } catch (error) {
        expect(error.customCode).toEqual(
          EXCEPTIONS.COMMON.FORBIDDEN.customCode,
        );
      }
    });

    it('should throw error', async () => {
      jest.spyOn(service, 'getByIds').mockRejectedValue(err);
      try {
        await service.validateVideosOwner(userId, ids);
      } catch (error) {
        expect(error).toEqual(err);
      }
    });
  });

  describe('getKalturaRedirectUrl', () => {
    const video = {
      files: [
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_360p.mp4',
          quality: '360p',
        },
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_240p.mp4',
          quality: '240p',
        },
      ],
    };

    it('should be ok', async () => {
      videosRepositoryMock.getById.mockReturnValue(video);
      const url = await service.getKalturaRedirectUrl('123', 'hls');
      expect(url).toEqual(
        '/hls/post/variants/123_,360p,240p,.mp4.urlset/master.m3u8',
      );
      const urlDash = await service.getKalturaRedirectUrl('123', 'dash');
      expect(urlDash).toEqual(
        '/dash/post/variants/123_,360p,240p,.mp4.urlset/manifest.mpd',
      );
    });

    it('should return not found', async () => {
      videosRepositoryMock.getById.mockReturnValue(null);

      try {
        await service.getKalturaRedirectUrl('123', 'hls');
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('handleTranscodeDone', () => {
    const vimeoId = 'vimeo123';
    const videoId = 'videoId';
    const err = new Error('err...');
    const video = {
      id: videoId,
      props: { postId: '123' },
      thumbnails: [{ url: 'abc' }],
      properties: { size: 123 },
    };

    it('should ok', async () => {
      vimeoServiceMock.getMp4Infos.mockResolvedValue({
        beinUploadId: videoId,
        mp4Infos: [
          { quality: 'uhd', rendition: '1440p', link: 'https://...1' },
          { quality: 'hd', rendition: '1080p', link: 'https://...2' },
          { quality: 'hd', rendition: '720p', link: 'https://...3' },
        ],
      });
      jest
        .spyOn(objectStorageServiceMock, 'uploadVariantVideo')
        .mockResolvedValue({ src: 'https://s3...' });
      videosRepositoryMock.updateById.mockResolvedValue(1);
      videosRepositoryMock.getById.mockResolvedValue(video);
      kafkaServiceMock.public.mockResolvedValue();
      vimeoServiceMock.delete.mockResolvedValue();

      await service.handleTranscodeDone(videoId, vimeoId);

      expect(vimeoServiceMock.getMp4Infos).toBeCalledWith(vimeoId);
      expect(objectStorageServiceMock.uploadVariantVideo).not.toBeCalledWith(
        'https://...1',
        videoId,
        '1440p',
      );
      expect(objectStorageServiceMock.uploadVariantVideo).toBeCalledWith(
        'https://...2',
        videoId,
        '1080p',
      );
      expect(objectStorageServiceMock.uploadVariantVideo).toBeCalledWith(
        'https://...3',
        videoId,
        '720p',
      );
      expect(videosRepositoryMock.updateById).toBeCalledWith(videoId, {
        files: [
          { quality: '1080p', src: 'https://s3...' },
          { quality: '720p', src: 'https://s3...' },
        ],
        status: UPLOAD_VIDEO_STATUS.DONE,
      });
      expect(kafkaServiceMock.public).toBeCalledWith(
        EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
        {
          videoId: videoId,
          postId: video.props.postId,
          status: UPLOAD_VIDEO_STATUS.DONE,
          hlsUrl: VideoHelper.getHlsUrl(service['hlsPrefixUrl'], videoId),
          thumbnails: video.thumbnails,
          properties: video.properties,
        },
      );
      expect(vimeoServiceMock.delete).toBeCalledWith(vimeoId);
    });

    it('should throw error', async () => {
      vimeoServiceMock.getMp4Infos.mockRejectedValue(err);

      expect(service.handleTranscodeDone(videoId, vimeoId)).rejects.toThrow(
        err,
      );
    });
  });

  describe('handleTranscodeError', () => {
    const vimeoId = 'vimeo123';
    const videoId = 'videoId';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(service, 'handleVideoFailed').mockResolvedValue();

      await service.handleTranscodeError(videoId, vimeoId);

      expect(service.handleVideoFailed).toBeCalledTimes(1);
    });

    it('should throw error', async () => {
      jest.spyOn(service, 'handleVideoFailed').mockRejectedValue(err);

      expect(service.handleTranscodeError(videoId, vimeoId)).rejects.toThrow(
        err,
      );
    });
  });

  describe('handleVideoFailed', () => {
    const videoId = 'videoId';
    const video = {
      id: videoId,
      props: { postId: '123' },
    };
    const err = new Error('err...');

    it('should ok', async () => {
      videosRepositoryMock.updateById.mockResolvedValue(1);
      videosRepositoryMock.getById.mockResolvedValue(video);
      kafkaServiceMock.public.mockResolvedValue();

      await service.handleVideoFailed(videoId);

      expect(videosRepositoryMock.updateById).toBeCalledWith(videoId, {
        status: UPLOAD_VIDEO_STATUS.ERROR,
      });
      expect(videosRepositoryMock.getById).toBeCalledWith(videoId);
      expect(kafkaServiceMock.public).toBeCalledWith(
        EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
        {
          videoId: video.id,
          postId: video.props?.postId,
          status: UPLOAD_VIDEO_STATUS.ERROR,
        },
      );
    });

    it('should throw error', async () => {
      videosRepositoryMock.updateById.mockRejectedValue(err);

      expect(service.handleVideoFailed(videoId)).rejects.toThrow(err);
    });
  });

  describe('processing', () => {
    const vimeoId = 'vimeo123';
    const videoId = 'videoId';
    const video = {
      originUrl:
        'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/origin/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073.mp4',
      files: [
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_360p.mp4',
          quality: '360p',
        },
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_240p.mp4',
          quality: '240p',
        },
      ],
    };
    const err = new Error('err...');

    it('should ok', async () => {
      videosRepositoryMock.getById.mockReturnValue(video);
      objectStorageServiceMock.downloadVideoFromS3.mockResolvedValue('');
      vimeoServiceMock.upload.mockResolvedValue({ id: vimeoId });
      vimeoServiceMock.addIntervalCheckTranscodeStatus.mockReturnValue();
      videosRepositoryMock.updateById.mockResolvedValue(1);

      await service.processing(videoId);

      expect(videosRepositoryMock.getById).toBeCalledWith(videoId);
      expect(objectStorageServiceMock.downloadVideoFromS3).toBeCalled();
      expect(vimeoServiceMock.upload).toBeCalledWith(
        videoId,
        '/tmp/' + videoId + '_origin',
      );
      expect(vimeoServiceMock.addIntervalCheckTranscodeStatus).toBeCalledWith(
        videoId,
        vimeoId,
      );
      expect(videosRepositoryMock.updateById).toBeCalledWith(videoId, {
        status: UPLOAD_VIDEO_STATUS.PROCESSING,
        props: { vimeoId },
      });
    });
    it('should throw error', async () => {
      jest.spyOn(service, 'handleTranscodeError').mockRejectedValue(err);
      videosRepositoryMock.getById.mockRejectedValue(err);

      expect(service.processing(videoId)).rejects.toThrow(err);
    });
    it('should throw error', async () => {
      videosRepositoryMock.getById.mockResolvedValue({});
      jest.spyOn(service, 'handleTranscodeError').mockResolvedValue();

      try {
        await service.processing(videoId);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(
          EXCEPTIONS.VIDEO.NOT_FOUND_ORIGIN_URL.customCode,
        );
      }
    });
  });

  describe('upload', () => {
    const videoId = 'videoId';
    const userId = 'user_id';
    const file = {
      originalname: '123.mp4',
      mimetype: 'video/...',
      filename: 'uuid',
      size: 123,
    } as Express.Multer.File;
    const videoUploadType = VideoUploadType.postVideo;
    const video = {
      id: videoId,
      originUrl:
        'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/origin/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073.mp4',
      files: [
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_360p.mp4',
          quality: '360p',
        },
        {
          src: 'https://bein-user-upload-videos-develop.s3.ap-southeast-1.amazonaws.com/post/variants/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073_240p.mp4',
          quality: '240p',
        },
      ],
      status: UPLOAD_VIDEO_STATUS.INIT,
    };
    const metadata = new Metadata({});
    const thumbnailRecord = [{ url: 'abc' }];
    const videoFullPath = path.join(getUploadTempPath(), file.filename);

    it('should ok', async () => {
      videosRepositoryMock.getByIdAsUser.mockResolvedValue(video);
      metadataHelperMock['getMetadataVideo'] = jest
        .fn()
        .mockResolvedValue(metadata);
      jest
        .spyOn(service, 'generateThumbnailsAndUploadToS3')
        .mockReturnValue(thumbnailRecord as any);

      objectStorageServiceMock.uploadOriginVideo.mockResolvedValue({
        src: video.originUrl,
      });
      videosRepositoryMock.updateById.mockResolvedValue(1);
      const res = await service.upload(userId, videoId, file, videoUploadType);

      expect(res).toEqual({
        id: videoId,
        status: UPLOAD_VIDEO_STATUS.UPLOADED,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: metadata.getWidthAfterRotate(),
          height: metadata.getHeightAfterRotate(),
          videoCodec: metadata.getCodecName(),
          duration: metadata.getDuration(),
          fps: metadata.getFPS(),
        },
        thumbnails: thumbnailRecord,
        isUse: false,
      });
      expect(videosRepositoryMock.getByIdAsUser).toBeCalledWith(
        videoId,
        userId,
      );
      expect(metadataHelperMock['getMetadataVideo']).toBeCalledWith(
        videoFullPath,
      );
      expect(service.generateThumbnailsAndUploadToS3).toBeCalledWith(
        videoId,
        videoFullPath,
        videoUploadType,
        metadata,
      );
      expect(objectStorageServiceMock.uploadOriginVideo).toBeCalledWith(
        videoFullPath,
        videoId,
        file.originalname,
        videoUploadType,
      );

      expect(videosRepositoryMock.updateById).toBeCalledWith(videoId, {
        originUrl: video.originUrl,
        status: UPLOAD_VIDEO_STATUS.UPLOADED,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: metadata.getWidthAfterRotate(),
          height: metadata.getHeightAfterRotate(),
          videoCodec: metadata.getCodecName(),
          duration: metadata.getDuration(),
          fps: metadata.getFPS(),
        },
        thumbnails: thumbnailRecord,
        isUse: false,
      });
      expect(deleteFile).toBeCalledTimes(1);
    });
    it('should throw error', async () => {
      videosRepositoryMock.getByIdAsUser.mockResolvedValue({});
      try {
        await service.upload(userId, videoId, file, videoUploadType);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(
          EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED.customCode,
        );
        expect(deleteFile).toBeCalledTimes(1);
      }
    });
  });

  describe('initIntervalCheckProcessing', () => {
    const videos = [
      {
        id: '1',
        props: {
          vimeoId: '11',
        },
      },
      {
        id: '2',
        props: {
          vimeoId: '22',
        },
      },
    ];
    const err = new Error('err...');

    it('should ok', async () => {
      videosRepositoryMock.filter.mockResolvedValue(videos);

      await service.initIntervalCheckProcessing();
      expect(videosRepositoryMock.filter).toBeCalledWith({
        status: UPLOAD_VIDEO_STATUS.PROCESSING,
      });
      expect(vimeoServiceMock.addIntervalCheckTranscodeStatus).toBeCalledWith(
        videos[0].id,
        videos[0].props.vimeoId,
      );
      expect(vimeoServiceMock.addIntervalCheckTranscodeStatus).toBeCalledWith(
        videos[1].id,
        videos[1].props.vimeoId,
      );
    });
    it('should throw error', async () => {
      videosRepositoryMock.filter.mockRejectedValue(err);

      await service.initIntervalCheckProcessing();
      expect(videosRepositoryMock.filter).toBeCalledWith({
        status: UPLOAD_VIDEO_STATUS.PROCESSING,
      });
      expect(vimeoServiceMock.addIntervalCheckTranscodeStatus).toBeCalledTimes(
        0,
      );
    });
  });

  describe('generateThumbnailsAndUploadToS3', () => {
    const videoId = 'videoId';
    const metadata = new Metadata({});
    const videoFullPath = path.join('abcd/abcde');
    const thumbnails = [
      { width: 11, height: 22, path: '11...' },
      { width: 55, height: 66, path: '55...' },
    ];
    const resExpect = [
      { width: 11, height: 22, url: '...' },
      { width: 55, height: 66, url: '...' },
    ];
    const s3Key = 's3_key';
    const thumbnailUrl = '...';

    it('should ok', async () => {
      thumbnailHelperMock['generateThumbnail'] = jest
        .fn()
        .mockResolvedValue(thumbnails);
      videoHelperMock['getVideoThumbnailS3Key'] = jest
        .fn()
        .mockReturnValue(s3Key);

      objectStorageServiceMock.uploadThumbnailToS3.mockResolvedValue({
        src: thumbnailUrl,
      });
      const res = await service.generateThumbnailsAndUploadToS3(
        videoId,
        videoFullPath,
        VideoUploadType.postVideo,
        metadata,
      );

      expect(res).toEqual(resExpect);
      expect(objectStorageServiceMock.uploadThumbnailToS3).toBeCalledWith(
        thumbnails[0].path,
        s3Key,
      );
      expect(objectStorageServiceMock.uploadThumbnailToS3).toBeCalledWith(
        thumbnails[1].path,
        s3Key,
      );
      expect(VideoHelper.getVideoThumbnailS3Key).toBeCalledTimes(
        thumbnails.length,
      );
      expect(deleteFile).toBeCalledTimes(thumbnails.length);
    });
  });

  describe('deleteVideosNotUse', () => {
    const listVideos = [];
    const err = new Error('err...');

    it('should ok', async () => {
      videosRepositoryMock.getVideosNotUse.mockImplementation(
        jest.fn(({ offset, limit, maxAgeInHour }) => {
          const videos = [];
          let elementCount = limit;
          if (offset > 3333) {
            elementCount -= 1;
          }
          for (let i = 0; i < elementCount; i++) {
            videos.push({ id: offset });
          }
          listVideos.push(videos);
          return videos;
        }),
      );
      jest.spyOn(service, 'deleteByIds').mockResolvedValue();

      await service.deleteVideosNotUse(1);

      expect(videosRepositoryMock.getVideosNotUse).toBeCalledTimes(
        listVideos.length,
      );
      listVideos.forEach((videos) => {
        const ids = videos.map((video) => video.id);
        expect(service.deleteByIds).toBeCalledWith(ids);
      });
    });

    it('should throw error', async () => {
      videosRepositoryMock.getVideosNotUse.mockRejectedValue(err);
      jest.spyOn(service, 'deleteByIds').mockResolvedValue();

      await service.deleteVideosNotUse(1);

      expect(videosRepositoryMock.getVideosNotUse).toBeCalledTimes(1);
    });
  });
});
