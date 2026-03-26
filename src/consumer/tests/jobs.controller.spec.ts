import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideosService } from '../../videos/videos.service';
import { FilesService } from '../../files/files.service';
import { ImagesService } from '../../images/images.service';
import { FileConsumer } from '../file.consumer';
import { VideoConsumer } from '../video.consumer';
import { ImageConsumer } from '../image.consumer';

import { mockClass } from '../../common/helpers';

const videosServiceMock = mockClass<VideosService>();
const filesServiceMock = mockClass<FilesService>();
const imagesServiceMock = mockClass<ImagesService>();
const configService = mockClass<ConfigService>();

describe('JobsController', () => {
  let imageConsumer: ImageConsumer;
  let fileConsumer: FileConsumer;
  let videoConsumer: VideoConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileConsumer, VideoConsumer, ImageConsumer],
      providers: [
        { provide: VideosService, useValue: videosServiceMock },
        { provide: FilesService, useValue: filesServiceMock },
        { provide: ImagesService, useValue: imagesServiceMock },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    fileConsumer = module.get<FileConsumer>(FileConsumer);
    imageConsumer = module.get<ImageConsumer>(ImageConsumer);
    videoConsumer = module.get<VideoConsumer>(VideoConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(fileConsumer).toBeDefined();
    expect(imageConsumer).toBeDefined();
    expect(videoConsumer).toBeDefined();
  });

  describe('deleteVideos', () => {
    const userId = '1234';
    const videoIds = ['v1', 'v2'];
    const err = new Error('err...');
    it('should ok', async () => {
      const msgContent = { videoIds, userId };
      videosServiceMock.deleteByIds.mockResolvedValue();

      await videoConsumer.deleteVideos(msgContent);
      expect(videosServiceMock.deleteByIds).toBeCalledWith(videoIds, userId);
    });

    it('should print log if has error', async () => {
      const msgContent = { videoIds, userId };
      videosServiceMock.deleteByIds.mockRejectedValue(err);

      await videoConsumer.deleteVideos(msgContent);
      expect(videosServiceMock.deleteByIds).toBeCalledWith(videoIds, userId);
    });
  });

  describe('markVideosHasBeenUsed', () => {
    const userId = '1234';
    const videoIds = ['v1', 'v2'];
    const err = new Error('err...');
    it('should ok', async () => {
      const msgContent = { videoIds, userId };
      videosServiceMock.markVideosHasBeenUsed.mockResolvedValue();

      await videoConsumer.markVideosHasBeenUsed(msgContent);
      expect(videosServiceMock.markVideosHasBeenUsed).toBeCalledWith(
        videoIds,
        userId,
      );
    });

    it('should print log if has error', async () => {
      const msgContent = { videoIds, userId };
      videosServiceMock.markVideosHasBeenUsed.mockRejectedValue(err);

      await videoConsumer.markVideosHasBeenUsed(msgContent);
      expect(videosServiceMock.markVideosHasBeenUsed).toBeCalledWith(
        videoIds,
        userId,
      );
    });
  });

  describe('deleteFiles', () => {
    const userId = '1234';
    const fileIds = ['v1', 'v2'];
    const err = new Error('err...');
    it('should ok', async () => {
      const msgContent = { fileIds, userId };
      filesServiceMock.deleteByIds.mockResolvedValue();

      await fileConsumer.deleteFiles(msgContent);
      expect(filesServiceMock.deleteByIds).toBeCalledWith(fileIds, userId);
    });

    it('should print log if has error', async () => {
      const msgContent = { fileIds, userId };
      filesServiceMock.deleteByIds.mockRejectedValue(err);

      await fileConsumer.deleteFiles(msgContent);
      expect(filesServiceMock.deleteByIds).toBeCalledWith(fileIds, userId);
    });
  });

  describe('markFilesHasBeenUsed', () => {
    const userId = '1234';
    const fileIds = ['v1', 'v2'];
    const err = new Error('err...');
    it('should ok', async () => {
      const msgContent = { fileIds, userId };
      filesServiceMock.markFilesHasBeenUsed.mockResolvedValue();

      await fileConsumer.markFilesHasBeenUsed(msgContent);
      expect(filesServiceMock.markFilesHasBeenUsed).toBeCalledWith(
        fileIds,
        userId,
      );
    });

    it('should print log if has error', async () => {
      const msgContent = { fileIds, userId };
      filesServiceMock.markFilesHasBeenUsed.mockRejectedValue(err);

      await fileConsumer.markFilesHasBeenUsed(msgContent);
      expect(filesServiceMock.markFilesHasBeenUsed).toBeCalledWith(
        fileIds,
        userId,
      );
    });
  });
});
