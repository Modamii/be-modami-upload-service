import { Injectable, Logger } from '@nestjs/common';
import path from 'path';

import { FilesRepository } from './files.repository';
import { ObjectStorageService } from '../object-storage/object-storage.service';
import { deleteFile, getUploadTempPath } from '../common/helpers';

import { FileUploadType } from '../common/dto';
import { Exception, EXCEPTIONS } from '../common/exceptions';
import { DELETE_FILE_NOT_USE_BULK_SIZE_IN_NUMBER } from './files.constant';
import { VideoHelper } from 'src/videos/videos.helper';

@Injectable()
export class FilesService {
  private logger = new Logger(FilesService.name);
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async create(userId: string) {
    return this.filesRepository.create({ userId });
  }

  async gets() {
    return this.filesRepository.filter();
  }

  async getById(id: string) {
    return this.filesRepository.getById(id);
  }

  async getByIds(ids: string[], userId?: string) {
    return this.filesRepository.getByIds({ userId, ids });
  }

  async deleteByIds(ids: string[], userId?: string): Promise<void> {
    if (!ids || ids.length == 0) return;
    if (userId) {
      await this.validateFilesOwner(userId, ids);
    }
    await this.filesRepository.deleteByIds(ids, userId);

    this.deleteFilesInObjectStorage(ids)
      .then(() => {
        this.logger.log({ message: 'delete files success', fileIds: ids });
      })
      .catch((error) => {
        this.logger.log({
          message: 'delete files failed',
          fileIds: ids,
          error,
        });
      });
  }

  async validateFilesOwner(userId: string, ids: string[]): Promise<void> {
    const files = await this.getByIds(ids, userId);
    if (files.length != ids.length) {
      this.logger.log({
        message: 'validate owner failed',
        fileIds: ids,
        userId,
      });
      throw new Exception(EXCEPTIONS.COMMON.FORBIDDEN).withFields({
        detailedError: `userId=${userId} ids=${ids}`,
      });
    }
  }

  async deleteFilesInObjectStorage(ids: string[]) {
    const files = await this.filesRepository.getByIds({
      ids,
      excludeDeleted: false,
    });
    const urls = files
      .map((file) => file.originUrl)
      .filter((url) => url != undefined && url != null);

    this.logger.verbose({ message: 'deleteFilesInObjectStorage', urls });

    if (urls.length > 0) {
      await this.objectStorageService.deleteFiles(urls);
    }
  }

  async markFilesHasBeenUsed(ids: string[], userId?: string): Promise<void> {
    if (userId) {
      await this.validateFilesOwner(userId, ids);
    }
    await this.filesRepository.markFilesHasBeenUsed(ids);

    this.logger.log({
      message: 'mark files has been used success',
      fileIds: ids,
    });
  }

  async upload(
    userId: string,
    fileId: string,
    file: Express.Multer.File,
    fileUploadType: FileUploadType,
  ) {
    const fileFullPath = path.join(getUploadTempPath(), file.filename);
    try {
      this.logger.verbose({ message: 'upload', fileId, data: file });
      // check file id exist
      const fileRecord = await this.filesRepository.getByIdAsUser(
        fileId,
        userId,
      );
      if (!fileRecord || fileRecord.originUrl) {
        throw new Exception(EXCEPTIONS.FILE.FILE_ID_HAS_BEEN_USED).withFields({
          detailedError: `userId=${userId} fileId=${fileId}`,
        });
      }
      // upload to s3
      const key = VideoHelper.getOriginFileS3Key(fileUploadType, {
        fileId,
      });
      const { src } = await this.objectStorageService.uploadFileToS3(
        fileFullPath,
        key,
        file.originalname,
      );

      // update db
      const data = {
        originUrl: src,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        isUse: false,
      };
      await this.filesRepository.updateById(fileId, data);
      deleteFile(fileFullPath);
      this.logger.log({
        message: 'upload file success',
        fileId,
        properties: data.properties,
        resource: fileUploadType,
        userId: fileRecord.userId,
      });
      return {
        id: fileId,
        ...data,
      };
    } catch (error) {
      deleteFile(fileFullPath);
      this.logger.log({ message: 'upload file failed', fileId, error });
      throw error;
    }
  }

  /**
   * This function delete files upload success but not use in any service
   */
  async deleteFilesNotUse(maxAgeInHour?: number) {
    try {
      let offset = 0;
      while (true) {
        const files = await this.filesRepository.getFilesNotUse({
          offset,
          limit: DELETE_FILE_NOT_USE_BULK_SIZE_IN_NUMBER,
          maxAgeInHour,
        });
        const ids = files.map((file) => file.id);
        await this.deleteByIds(ids);

        if (files.length < DELETE_FILE_NOT_USE_BULK_SIZE_IN_NUMBER) {
          break;
        }
        offset += DELETE_FILE_NOT_USE_BULK_SIZE_IN_NUMBER;
      }
    } catch (error) {
      if (error.customCode !== EXCEPTIONS.FILE.NOT_FOUND.customCode) {
        this.logger.log({ message: 'delete files not use failed', error });
      }
    }
  }
}
