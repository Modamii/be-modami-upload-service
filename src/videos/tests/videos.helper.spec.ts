import path from 'path';
jest.mock('sharp', () =>
  jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockReturnThis(),
  } as any),
);
import { ThumbnailHelper } from '../videos.helper';
import { MetadataHelper, Metadata } from '../../common/helpers/metadata.helper';
import * as ffmpeg from '../../common/helpers/ffmpeg.helper';

import { deleteFile, getUploadTempPath } from '../../common/helpers';
let metadataHelperMock: MetadataHelper;
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

describe('ThumbnailHelper', () => {
  const fullPath = '/src/123.mp4';
  const videoId = 'video_id';
  const metadata = new Metadata({
    streams: [{ codec_type: 'video', width: 100, height: 200 }],
  });
  const thumbnailPath = path.join(getUploadTempPath(), videoId + '.jpg');

  beforeEach(async () => {
    metadataHelperMock = MetadataHelper as jest.MockedClass<
      typeof MetadataHelper
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateThumbnail', () => {
    const resExpect = [
      {
        height: 240,
        path: '/tmp/uploads/video_id_120x240.jpg',
        width: 120,
      },
      {
        height: 360,
        path: '/tmp/uploads/video_id_180x360.jpg',
        width: 180,
      },
      {
        height: 480,
        path: '/tmp/uploads/video_id_240x480.jpg',
        width: 240,
      },
      {
        height: 720,
        path: '/tmp/uploads/video_id_360x720.jpg',
        width: 360,
      },
    ];

    it('should ok', async () => {
      let command = '';
      metadataHelperMock['getMetadataVideo'] = jest
        .fn()
        .mockResolvedValue(metadata);
      jest.spyOn(ffmpeg, 'RunFfmpeg').mockImplementation((ffmpeg) => {
        command = ffmpeg._getArguments().join(' ');
        return {} as any;
      });

      const res = await ThumbnailHelper.generateThumbnail(
        fullPath,
        videoId,
        metadata,
      );
      expect(res).toEqual(resExpect);
      expect(ffmpeg.RunFfmpeg).toBeCalledTimes(1);
      expect(command).toEqual(
        `-ss 0 -i ${fullPath} -y -vframes 1 ${thumbnailPath}`,
      );

      expect(deleteFile).toBeCalledTimes(1);
    });

    it('should call getMetadataVideo', async () => {
      let command = '';
      metadataHelperMock['getMetadataVideo'] = jest
        .fn()
        .mockResolvedValue(metadata);
      jest.spyOn(ffmpeg, 'RunFfmpeg').mockImplementation((ffmpeg) => {
        command = ffmpeg._getArguments().join(' ');
        return {} as any;
      });

      const res = await ThumbnailHelper.generateThumbnail(
        fullPath,
        videoId,
        null,
      );
      expect(res).toEqual(resExpect);
      expect(ffmpeg.RunFfmpeg).toBeCalledTimes(1);
      expect(command).toEqual(
        `-ss 0 -i ${fullPath} -y -vframes 1 ${thumbnailPath}`,
      );

      expect(deleteFile).toBeCalledTimes(1);
    });
  });
});
