import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { mockClass, TimeHelper } from '../../common/helpers';
import { FilesRepository } from '../files.repository';
import { FileModel } from '../../database/models';
import { Exception, EXCEPTIONS } from '../../common/exceptions';
import { DEFAULT_LIMIT, FIRST_OFFSET } from '../../common/constants';

const fileModelMock = mockClass<typeof FileModel>();

describe('FilesRepository', () => {
  let repository: FilesRepository;
  const id = 'video_id';
  const err = new Error('err...');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: getModelToken(FileModel),
          useValue: fileModelMock,
        },
        FilesRepository,
      ],
    }).compile();

    repository = module.get<FilesRepository>(FilesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getById', () => {
    it('should ok', async () => {
      fileModelMock.findOne.mockResolvedValue({ get: jest.fn() });

      await repository.getById(id);

      expect(fileModelMock.findOne).toBeCalledWith({
        where: { id },
        paranoid: true,
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.findOne.mockRejectedValue(err);

      expect(repository.getById(id)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.findOne.mockResolvedValue(null);

      try {
        await repository.getById(id);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.FILE.NOT_FOUND.customCode);
      }
    });
  });

  describe('getByIds', () => {
    const ids = ['1', '2'];
    const userId = 'u1';

    it('should ok', async () => {
      fileModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);

      await repository.getByIds({ ids, userId, excludeDeleted: false });

      expect(fileModelMock.findAll).toBeCalledWith({
        where: { id: ids, userId },
        paranoid: false,
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.findAll.mockRejectedValue(err);

      expect(
        repository.getByIds({ ids, userId, excludeDeleted: false }),
      ).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.findAll.mockResolvedValue([]);

      try {
        await repository.getByIds({ ids, userId, excludeDeleted: false });
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.FILE.NOT_FOUND.customCode);
      }
    });
  });

  describe('getByIdAsUser', () => {
    const userId = '10';
    it('should ok', async () => {
      fileModelMock.findOne.mockResolvedValue({ get: jest.fn() });

      await repository.getByIdAsUser(id, userId);

      expect(fileModelMock.findOne).toBeCalledWith({ where: { id, userId } });
    });

    it('should throw error when query error', async () => {
      fileModelMock.findOne.mockRejectedValue(err);

      expect(repository.getByIdAsUser(id, userId)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.findOne.mockResolvedValue(null);

      expect(repository.getByIdAsUser(id, userId)).rejects.toBeInstanceOf(
        Exception,
      );
    });
  });

  describe('filter', () => {
    it('should ok', async () => {
      fileModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);

      await repository.filter({});

      expect(fileModelMock.findAll).toBeCalledWith({
        offset: 0,
        limit: 10,
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.findAll.mockRejectedValue(err);

      expect(repository.filter({})).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.findAll.mockResolvedValue([]);

      expect(repository.filter({})).resolves.toEqual([]);
    });
  });

  describe('create', () => {
    it('should ok', async () => {
      fileModelMock.create.mockResolvedValue({ get: jest.fn() });

      await repository.create({ userId: '22' });

      expect(fileModelMock.create).toBeCalledWith({
        id: expect.any(String),
        userId: '22',
        version: expect.any(String),
        isUse: false,
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.create.mockRejectedValue(err);

      expect(repository.create({ userId: '22' })).rejects.toEqual(err);
    });
  });

  describe('updateById', () => {
    it('should ok', async () => {
      fileModelMock.update.mockResolvedValue([0]);

      await repository.updateById(id, {} as any);

      expect(fileModelMock.update).toBeCalledWith({}, { where: { id } });
    });

    it('should ok and remove not allow fields', async () => {
      fileModelMock.update.mockResolvedValue([0]);

      await repository.updateById(id, { test: 1 } as any);

      expect(fileModelMock.update).toBeCalledWith({}, { where: { id } });
    });

    it('should throw error when query error', async () => {
      fileModelMock.update.mockRejectedValue(err);

      expect(repository.updateById(id, {} as any)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.update.mockResolvedValue([0]);

      const updateCount = await repository.updateById(id, {} as any);
      expect(updateCount).toEqual(0);
    });
  });

  describe('deleteById', () => {
    it('should ok', async () => {
      fileModelMock.destroy.mockResolvedValue({ get: jest.fn() });

      await repository.deleteById(id, '22');

      expect(fileModelMock.destroy).toBeCalledWith({
        where: { id, userId: '22' },
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.destroy.mockRejectedValue(err);

      expect(repository.deleteById(id)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.destroy.mockResolvedValue(0);

      try {
        await repository.deleteById(id);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.FILE.NOT_FOUND.customCode);
      }
    });
  });

  describe('deleteByIds', () => {
    const ids = ['1', '2'];
    const userId = 'u1';

    it('should ok', async () => {
      fileModelMock.destroy.mockResolvedValue(ids);

      await repository.deleteByIds(ids, userId);

      expect(fileModelMock.destroy).toBeCalledWith({
        where: { id: ids, userId: userId },
      });
    });

    it('should ok, undefined user', async () => {
      fileModelMock.destroy.mockResolvedValue(ids.length);

      await repository.deleteByIds(ids, undefined);

      expect(fileModelMock.destroy).toBeCalledWith({
        where: { id: ids },
      });
    });

    it('should throw error when query error', async () => {
      fileModelMock.destroy.mockRejectedValue(err);

      expect(repository.deleteByIds(ids, userId)).rejects.toEqual(err);
    });

    it('should throw error when not found', async () => {
      fileModelMock.destroy.mockResolvedValue(0);

      try {
        await repository.deleteByIds(ids, userId);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(EXCEPTIONS.FILE.NOT_FOUND.customCode);
      }
    });
  });

  describe('markFilesHasBeenUsed', () => {
    const ids = ['1', '2'];

    it('should ok', async () => {
      fileModelMock.update.mockResolvedValue([ids.length]);

      const res = await repository.markFilesHasBeenUsed(ids);
      expect(res).toEqual(ids.length);
      expect(fileModelMock.update).toBeCalledWith(
        { isUse: true },
        {
          where: { id: ids },
        },
      );
    });
  });

  describe('getFilesNotUse', () => {
    const maxAgeInHour = 1;
    const maxAge = '123';

    it('should ok', async () => {
      fileModelMock.findAll.mockResolvedValue([{ get: jest.fn() }]);
      TimeHelper.getTimeAgo = jest.fn().mockReturnValue(maxAge);

      await repository.getFilesNotUse({ maxAgeInHour });
      expect(fileModelMock.findAll).toBeCalledWith({
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
