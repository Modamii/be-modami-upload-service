import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from '../../videos/videos.service';
import { PostConsumer } from '../post.consumer';

import { mockClass } from '../../common/helpers';
import { BSVideoPostHasBeenCreatedDto } from '../dto/consumer.dto';
const videosServiceMock = mockClass<VideosService>();

describe('PostController', () => {
  let controller: PostConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostConsumer],
      providers: [{ provide: VideosService, useValue: videosServiceMock }],
    }).compile();

    controller = module.get<PostConsumer>(PostConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('handleVideoPostHasBeenCreated', () => {
    const postId = '1234';
    const videoIds = ['v1', 'v2'];
    const err = new Error('err...');
    it('should ok', async () => {
      const msgContent: BSVideoPostHasBeenCreatedDto = { postId, videoIds };
      videosServiceMock.getById.mockResolvedValue({ props: { test: 1 } });
      videosServiceMock.update.mockResolvedValue(1);
      videosServiceMock.processing.mockResolvedValue({});

      await controller.handleVideoPostHasBeenCreated(msgContent);
      expect(videosServiceMock.getById).toBeCalledWith(videoIds[0]);
      expect(videosServiceMock.getById).toBeCalledWith(videoIds[1]);
      expect(videosServiceMock.update).toBeCalledWith(videoIds[0], {
        props: { postId: msgContent.postId, test: 1 },
      });
      expect(videosServiceMock.update).toBeCalledWith(videoIds[0], {
        props: { postId: msgContent.postId, test: 1 },
      });
      expect(videosServiceMock.processing).toBeCalledWith(videoIds[0]);
      expect(videosServiceMock.processing).toBeCalledWith(videoIds[1]);
    });

    it('should ok when null props', async () => {
      const msgContent: BSVideoPostHasBeenCreatedDto = { postId, videoIds };
      videosServiceMock.getById.mockResolvedValue({});
      videosServiceMock.update.mockResolvedValue(1);
      videosServiceMock.processing.mockResolvedValue({});

      await controller.handleVideoPostHasBeenCreated(msgContent);
      expect(videosServiceMock.getById).toBeCalledWith(videoIds[0]);
      expect(videosServiceMock.getById).toBeCalledWith(videoIds[1]);
      expect(videosServiceMock.update).toBeCalledWith(videoIds[0], {
        props: { postId: msgContent.postId },
      });
      expect(videosServiceMock.update).toBeCalledWith(videoIds[0], {
        props: { postId: msgContent.postId },
      });
      expect(videosServiceMock.processing).toBeCalledWith(videoIds[0]);
      expect(videosServiceMock.processing).toBeCalledWith(videoIds[1]);
    });

    it('should throw error', async () => {
      const msgContent: BSVideoPostHasBeenCreatedDto = { postId, videoIds };
      videosServiceMock.getById.mockRejectedValue(err);

      await controller.handleVideoPostHasBeenCreated(msgContent);
      expect(videosServiceMock.getById).toBeCalledWith(videoIds[0]);
      expect(videosServiceMock.getById).toBeCalledTimes(1);
    });
  });
});
