import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../third-parties/kafka/kafka.service';
import { ObjectStorageService } from '../../object-storage/object-storage.service';
import { FilesRepository } from '../files.repository';
import { FilesService } from '../files.service';
import { deleteFile, mockClass, sleep } from '../../common/helpers';
import { FileUploadType } from '../../common/dto';
import { Exception, EXCEPTIONS } from '../../common/exceptions';

const configServiceMock = mockClass<ConfigService>();
const filesRepositoryMock = mockClass<FilesRepository>();
const kafkaServiceMock = mockClass<KafkaService>();
const objectStorageServiceMock = mockClass<ObjectStorageService>();

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
  let service: FilesService;

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
        { provide: FilesRepository, useValue: filesRepositoryMock },
        { provide: KafkaService, useValue: kafkaServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: ObjectStorageService, useValue: objectStorageServiceMock },
        FilesService,
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
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
      jest.spyOn(service, 'validateFilesOwner').mockResolvedValue();
      filesRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteFilesInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateFilesOwner).toBeCalledWith(userId, ids);
      expect(filesRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteFilesInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok, userId = undefined', async () => {
      const userId = undefined;
      jest.spyOn(service, 'validateFilesOwner').mockResolvedValue();
      filesRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteFilesInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateFilesOwner).toBeCalledTimes(0);
      expect(filesRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteFilesInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok, userId = null', async () => {
      const userId = null;
      jest.spyOn(service, 'validateFilesOwner').mockResolvedValue();
      filesRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteFilesInObjectStorage').mockResolvedValue();

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateFilesOwner).toBeCalledTimes(0);
      expect(filesRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteFilesInObjectStorage).toBeCalledWith(ids);
    });

    it('should ok when deleteFilesInObjectStorage error', async () => {
      jest.spyOn(service, 'validateFilesOwner').mockResolvedValue();
      filesRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteFilesInObjectStorage').mockRejectedValue(err);

      await service.deleteByIds(ids, userId);
      await sleep(100);

      expect(service.validateFilesOwner).toBeCalledWith(userId, ids);
      expect(filesRepositoryMock.deleteByIds).toBeCalledWith(ids, userId);
      expect(service.deleteFilesInObjectStorage).toBeCalledWith(ids);
    });

    it('should throw error', async () => {
      const userId = null;
      jest.spyOn(service, 'validateFilesOwner').mockRejectedValue(err);
      filesRepositoryMock.deleteByIds.mockResolvedValue(ids.length);
      jest.spyOn(service, 'deleteFilesInObjectStorage').mockResolvedValue();

      try {
        await service.deleteByIds(ids, userId);
      } catch (error) {
        expect(error).toEqual(err);
        expect(service.validateFilesOwner).toBeCalledTimes(1);
        expect(filesRepositoryMock.deleteByIds).toBeCalledTimes(0);
        expect(service.deleteFilesInObjectStorage).toBeCalledTimes(0);
      }
    });
  });

  describe('validateFilesOwner', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');

    it('should ok', async () => {
      jest.spyOn(service, 'getByIds').mockResolvedValue([{}, {}] as any);

      await service.validateFilesOwner(userId, ids);
      expect(service.getByIds).toBeCalledWith(ids, userId);
    });

    it('should throw error if any file id no permission', async () => {
      jest.spyOn(service, 'getByIds').mockResolvedValue([{}] as any);
      try {
        await service.validateFilesOwner(userId, ids);
      } catch (error) {
        expect(error.customCode).toEqual(
          EXCEPTIONS.COMMON.FORBIDDEN.customCode,
        );
      }
    });

    it('should throw error', async () => {
      jest.spyOn(service, 'getByIds').mockRejectedValue(err);
      try {
        await service.validateFilesOwner(userId, ids);
      } catch (error) {
        expect(error).toEqual(err);
      }
    });
  });

  describe('deleteFilesInObjectStorage', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');
    const files = [{ originUrl: 'https://1' }, { originUrl: 'https://2' }];

    it('should ok', async () => {
      filesRepositoryMock.getByIds.mockResolvedValue(files);
      objectStorageServiceMock.deleteFiles.mockResolvedValue();

      await service.deleteFilesInObjectStorage(ids);
      expect(filesRepositoryMock.getByIds).toBeCalledWith({
        ids,
        excludeDeleted: false,
      });
      expect(objectStorageServiceMock.deleteFiles).toBeCalledWith([
        files[0].originUrl,
        files[1].originUrl,
      ]);
    });

    it('should throw error', async () => {
      filesRepositoryMock.getByIds.mockResolvedValue(files);
      objectStorageServiceMock.deleteFiles.mockRejectedValue(err);

      try {
        await service.deleteFilesInObjectStorage(ids);
      } catch (error) {
        expect(error).toEqual(err);
        expect(filesRepositoryMock.getByIds).toBeCalledWith({
          ids,
          excludeDeleted: false,
        });
        expect(objectStorageServiceMock.deleteFiles).toBeCalledTimes(1);
      }
    });
  });

  describe('markFilesHasBeenUsed', () => {
    const ids = [
      'ac89f584-b219-44f9-8362-a48d9706c47e',
      'e750c6d5-81b0-4d81-a545-541ecfbffa50',
    ];
    const userId = 'e750c6d5-81b0-4d81-a545-541ecfbffa51';
    const err = new Error('err...');
    const files = [{ originUrl: 'https://1' }, { originUrl: 'https://2' }];

    it('should ok', async () => {
      jest.spyOn(service, 'validateFilesOwner').mockResolvedValue();
      filesRepositoryMock.markFilesHasBeenUsed.mockResolvedValue(2);

      await service.markFilesHasBeenUsed(ids, userId);

      expect(service.validateFilesOwner).toBeCalledWith(userId, ids);
      expect(filesRepositoryMock.markFilesHasBeenUsed).toBeCalledWith(ids);
    });

    it('should not check owner if !userId', async () => {
      jest.spyOn(service, 'validateFilesOwner').mockRejectedValue(err);
      filesRepositoryMock.markFilesHasBeenUsed.mockResolvedValue(2);

      await service.markFilesHasBeenUsed(ids, undefined);

      expect(service.validateFilesOwner).toBeCalledTimes(0);
      expect(filesRepositoryMock.markFilesHasBeenUsed).toBeCalledWith(ids);
    });
  });

  describe('upload', () => {
    const userId = '12345';
    const fileId = 'videoId';
    const file = {
      originalname: '123.mp4',
      mimetype: 'video/...',
      filename: 'uuid',
      size: 123,
    } as Express.Multer.File;
    const uploadType = FileUploadType.postFile;
    const video = {
      id: fileId,
      originUrl:
        'https://bein-user-upload-files-develop.s3.ap-southeast-1.amazonaws.com/post/origin/2c7ab52f-163f-48a4-9b00-c9fbcc6e5073.txt',
      properties: {
        name: 'test.txt',
        size: 27,
        mimeType: 'text/plain',
      },
      userId,
    };

    it('should ok', async () => {
      filesRepositoryMock.getByIdAsUser.mockResolvedValue({
        id: fileId,
        userId,
      });
      objectStorageServiceMock.uploadFileToS3.mockResolvedValue({
        src: video.originUrl,
      });
      filesRepositoryMock.updateById.mockResolvedValue(1);
      const res = await service.upload(userId, fileId, file, uploadType);

      expect(res).toEqual({
        id: fileId,
        originUrl: video.originUrl,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        isUse: false,
      });
      expect(filesRepositoryMock.getByIdAsUser).toBeCalledWith(fileId, userId);
      expect(objectStorageServiceMock.uploadFileToS3).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        file.originalname,
      );
      expect(filesRepositoryMock.updateById).toBeCalledWith(fileId, {
        originUrl: video.originUrl,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        isUse: false,
      });
      expect(deleteFile).toBeCalledTimes(1);
    });

    it('should throw error if not found file id', async () => {
      filesRepositoryMock.getByIdAsUser.mockResolvedValue(null);
      try {
        await service.upload(userId, fileId, file, uploadType);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(
          EXCEPTIONS.FILE.FILE_ID_HAS_BEEN_USED.customCode,
        );
        expect(deleteFile).toBeCalledTimes(1);
      }
    });

    it('should throw error if file has been uploaded', async () => {
      filesRepositoryMock.getByIdAsUser.mockResolvedValue({ originUrl: '...' });
      try {
        await service.upload(userId, fileId, file, uploadType);
        throw new Error('not expected');
      } catch (error) {
        expect(error).toBeInstanceOf(Exception);
        expect(error.customCode).toEqual(
          EXCEPTIONS.FILE.FILE_ID_HAS_BEEN_USED.customCode,
        );
        expect(deleteFile).toBeCalledTimes(1);
      }
    });
  });

  describe('deleteFilesNotUse', () => {
    const listFiles = [];
    const err = new Error('err...');

    it('should ok', async () => {
      filesRepositoryMock.getFilesNotUse.mockImplementation(
        jest.fn(({ offset, limit, maxAgeInHour }) => {
          const files = [];
          let elementCount = limit;
          if (offset > 3333) {
            elementCount -= 1;
          }
          for (let i = 0; i < elementCount; i++) {
            files.push({ id: offset });
          }
          listFiles.push(files);
          return files;
        }),
      );
      jest.spyOn(service, 'deleteByIds').mockResolvedValue();

      await service.deleteFilesNotUse(1);

      expect(filesRepositoryMock.getFilesNotUse).toBeCalledTimes(
        listFiles.length,
      );
      listFiles.forEach((files) => {
        const ids = files.map((file) => file.id);
        expect(service.deleteByIds).toBeCalledWith(ids);
      });
    });

    it('should throw error', async () => {
      filesRepositoryMock.getFilesNotUse.mockRejectedValue(err);
      jest.spyOn(service, 'deleteByIds').mockResolvedValue();

      await service.deleteFilesNotUse(1);

      expect(filesRepositoryMock.getFilesNotUse).toBeCalledTimes(1);
    });
  });
});
