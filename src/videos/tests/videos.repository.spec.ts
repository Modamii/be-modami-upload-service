import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
import { getModelToken } from '@nestjs/sequelize';
import { mockClass, TimeHelper } from '../../common/helpers';
import { VideosRepository } from '../videos.repository';
import { VideoModel } from '../../database/models';
import { UPLOAD_VIDEO_STATUS } from '../videos.constant';
import { Exception, EXCEPTIONS } from '../../common/exceptions';
import { DEFAULT_LIMIT, FIRST_OFFSET } from '../../common/constants';

const videoModelMock = mockClass<typeof VideoModel>();

describe('VideosRepository', () => {
  let repository: VideosRepository;
  const id = 'video_id';
  const err = new Error('err...');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: getModelToken(VideoModel),
          useValue: videoModelMock,
        },
        VideosRepository,
      ],
    }).compile();

    repository = module.get<VideosRepository>(VideosRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getById', () => {
    it('should ok', async () => {
      videoModelMock.findOne.mockResolvedValue({ get: jest.fn() });

      await repository.getById(id);

      expect(videoModelMock.findOne).toBeCalledWith({
        where: { id },
        paranoid: true,
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.findOne.mockRejectedValue(err);

      expect(repository.getById(id)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.findOne.mockResolvedValue(null);

      try {
        await repository.getById(id);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('getByIds', () => {
    const ids = ['1', '2'];
    const userId = 'u1';

    it('should ok', async () => {
      videoModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);

      await repository.getByIds({ ids, userId, excludeDeleted: false });

      expect(videoModelMock.findAll).toBeCalledWith({
        where: { id: ids, userId },
        paranoid: false,
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.findAll.mockRejectedValue(err);

      expect(
        repository.getByIds({ ids, userId, excludeDeleted: false }),
      ).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.findAll.mockResolvedValue([]);

      try {
        await repository.getByIds({ ids, userId, excludeDeleted: false });
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('getByIdAsUser', () => {
    const userId = '10';
    it('should ok', async () => {
      videoModelMock.findOne.mockResolvedValue({ get: jest.fn() });

      await repository.getByIdAsUser(id, userId);

      expect(videoModelMock.findOne).toBeCalledWith({ where: { id, userId } });
    });

    it('should throw error when query error', async () => {
      videoModelMock.findOne.mockRejectedValue(err);

      expect(repository.getByIdAsUser(id, userId)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.findOne.mockResolvedValue(null);

      try {
        await repository.getByIdAsUser(id, userId);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('filter', () => {
    it('should ok', async () => {
      videoModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);

      await repository.filter({ status: UPLOAD_VIDEO_STATUS.INIT });

      expect(videoModelMock.findAll).toBeCalledWith({
        offset: 0,
        limit: 10,
        where: { status: UPLOAD_VIDEO_STATUS.INIT },
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.findAll.mockRejectedValue(err);

      expect(
        repository.filter({ status: UPLOAD_VIDEO_STATUS.INIT }),
      ).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.findAll.mockResolvedValue([]);

      expect(
        repository.filter({ status: UPLOAD_VIDEO_STATUS.INIT }),
      ).resolves.toEqual([]);
    });
  });

  describe('create', () => {
    it('should ok', async () => {
      videoModelMock.create.mockResolvedValue({ get: jest.fn() });

      await repository.create({ userId: '22' });

      expect(videoModelMock.create).toBeCalledWith({
        id: expect.any(String),
        status: UPLOAD_VIDEO_STATUS.INIT,
        userId: '22',
        version: expect.any(String),
        isUse: false,
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.create.mockRejectedValue(err);

      expect(repository.create({ userId: '22' })).rejects.toEqual(err);
    });
  });

  describe('updateById', () => {
    it('should ok', async () => {
      videoModelMock.update.mockResolvedValue([1]);

      await repository.updateById(id, {});

      expect(videoModelMock.update).toBeCalledWith({}, { where: { id } });
    });

    it('should ok and remove not allow fields', async () => {
      videoModelMock.update.mockResolvedValue([1]);

      await repository.updateById(id, { test: 1 } as any);

      expect(videoModelMock.update).toBeCalledWith({}, { where: { id } });
    });

    it('should throw error when query error', async () => {
      videoModelMock.update.mockRejectedValue(err);

      expect(repository.updateById(id, {})).rejects.toEqual(err);
    });

    it('should return 0', async () => {
      videoModelMock.update.mockResolvedValue([0]);

      const updateCount = await repository.updateById(id, {});
      expect(updateCount).toEqual(0);
    });
  });

  describe('deleteById', () => {
    it('should ok', async () => {
      videoModelMock.destroy.mockResolvedValue({ get: jest.fn() });

      await repository.deleteById(id, '22');

      expect(videoModelMock.destroy).toBeCalledWith({
        where: { id, userId: '22' },
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.destroy.mockRejectedValue(err);

      expect(repository.deleteById(id)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.destroy.mockResolvedValue(0);

      try {
        await repository.deleteById(id);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('deleteByIds', () => {
    const ids = ['1', '2'];
    const userId = 'u1';

    it('should ok', async () => {
      videoModelMock.destroy.mockResolvedValue(ids);

      await repository.deleteByIds(ids, userId);

      expect(videoModelMock.destroy).toBeCalledWith({
        where: { id: ids, userId: userId },
      });
    });

    it('should ok, undefined user', async () => {
      videoModelMock.destroy.mockResolvedValue(ids.length);

      await repository.deleteByIds(ids, undefined);

      expect(videoModelMock.destroy).toBeCalledWith({
        where: { id: ids },
      });
    });

    it('should throw error when query error', async () => {
      videoModelMock.destroy.mockRejectedValue(err);

      expect(repository.deleteByIds(ids, userId)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      videoModelMock.destroy.mockResolvedValue(0);

      try {
        await repository.deleteByIds(ids, userId);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.VIDEO.NOT_FOUND.customCode);
      }
    });
  });

  describe('markVideosHasBeenUsed', () => {
    const ids = ['1', '2'];

    it('should ok', async () => {
      videoModelMock.update.mockResolvedValue([ids.length]);

      const res = await repository.markVideosHasBeenUsed(ids);
      expect(res).toEqual(ids.length);
      expect(videoModelMock.update).toBeCalledWith(
        { isUse: true },
        {
          where: { id: ids },
        },
      );
    });
  });

  describe('getVideosNotUse', () => {
    const maxAgeInHour = 1;
    const maxAge = '123';

    it('should ok', async () => {
      videoModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);
      TimeHelper.getTimeAgo = jest.fn().mockReturnValue(maxAge);

      await repository.getVideosNotUse({ maxAgeInHour });
      expect(videoModelMock.findAll).toBeCalledWith({
        offset: FIRST_OFFSET,
        limit: DEFAULT_LIMIT,
        where: {
          isUse: false,
          createdAt: {
            [Op.lte]: maxAge,
          },
        },
      });
      expect(TimeHelper.getTimeAgo).toBeCalledTimes(1);
    });
  });
});
