import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DestroyOptions, FindOptions, Op } from 'sequelize';
import { v4 as uuidV4 } from 'uuid';

import { FileModel } from '../../../pkg/database/models';
import { CURRENT_UPLOAD_FILE_VERSION } from '../../domain/file.constant';
import { Exception, EXCEPTIONS } from '../../../pkg/common/exceptions';
import { ObjectHelper, TimeHelper } from '../../../pkg/common/helpers';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR,
  FIRST_OFFSET,
} from '../../../pkg/common/constants';
import { FileDto } from '../../domain/file.domain';
import { IFileRepository } from '../../port/file-repository.port';

@Injectable()
export class FileRepository implements IFileRepository {
  constructor(@InjectModel(FileModel) private model: typeof FileModel) {}

  async getById(id: string, excludeDeleted: boolean = true) {
    const file = await this.model.findOne({
      where: { id },
      paranoid: excludeDeleted,
    });
    if (!file) {
      throw new Exception(EXCEPTIONS.FILE.NOT_FOUND).withFields({
        detailedError: `fileId=${id}`,
      });
    }
    return file.get({ plain: true });
  }

  async getByIds(args: {
    ids: string[];
    userId?: string;
    excludeDeleted?: boolean;
  }) {
    const { ids, userId, excludeDeleted } = args;
    const query: FindOptions<FileDto> = { where: { id: ids } };
    if (userId) {
      query.where = { ...query.where, userId };
    }
    if (excludeDeleted === false) {
      query.paranoid = excludeDeleted;
    }

    const file = await this.model.findAll(query);
    if (!file.length) {
      throw new Exception(EXCEPTIONS.FILE.NOT_FOUND).withFields({
        detailedError: `ids=${args.ids}`,
      });
    }
    return file.map((e: FileModel) => e.get({ plain: true }));
  }

  async getByIdAsUser(id: string, userId: string) {
    const file = await this.model.findOne({ where: { id, userId } });
    if (!file) {
      throw new Exception(EXCEPTIONS.FILE.NOT_FOUND).withFields({
        detailedError: `fileId=${id}; userId=${userId}`,
      });
    }
    return file.get({ plain: true });
  }

  async filter(
    filters: {
      offset?: number;
      limit?: number;
    } = {},
  ) {
    if (!filters.offset) {
      filters.offset = FIRST_OFFSET;
    }
    if (!filters.limit) {
      filters.limit = DEFAULT_LIMIT;
    }
    ObjectHelper.whiteList(filters, ['limit', 'offset']);

    const { offset, limit } = filters;

    const files = await this.model.findAll({
      offset,
      limit,
    });
    return files.map((file) => file.get({ plain: true }));
  }

  async create(params: { userId: string }) {
    ObjectHelper.whiteList(params, ['userId', 'originUrl', 'properties']);
    const file = await this.model.create({
      id: uuidV4(),
      userId: params.userId,
      version: CURRENT_UPLOAD_FILE_VERSION,
      isUse: false,
    });
    return file.get({ plain: true });
  }

  async updateById(
    id: string,
    data: { originUrl: string; properties: {}; isUse?: boolean },
  ): Promise<number> {
    ObjectHelper.whiteList(data, ['originUrl', 'properties', 'isUse']);
    const [updatedCount] = await this.model.update(data as any, {
      where: { id },
    });
    return updatedCount;
  }

  async deleteById(id: string, userId?: string): Promise<number> {
    const deletedCount = await this.model.destroy({
      where: { id, userId },
    });
    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.FILE.NOT_FOUND).withFields({
        detailedError: `fileId=${id}; userId=${userId}`,
      });
    }
    return deletedCount;
  }

  async deleteByIds(ids: string[], userId?: string): Promise<number> {
    const query: DestroyOptions<FileDto> = {
      where: { id: ids },
    };
    if (userId) {
      query.where = { ...query.where, userId };
    }

    const deletedCount = await this.model.destroy(query);
    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.FILE.NOT_FOUND).withFields({
        detailedError: `ids=${ids}; userId=${userId}`,
      });
    }
    return deletedCount;
  }

  async markFilesHasBeenUsed(ids: string[]) {
    const [updatedCount] = await this.model.update(
      { isUse: true },
      {
        where: { id: ids },
      },
    );
    return updatedCount;
  }

  async getFilesNotUse(
    filters: {
      offset?: number;
      limit?: number;
      maxAgeInHour?: number;
    } = {},
  ) {
    const maxAge = TimeHelper.getTimeAgo(
      filters.maxAgeInHour || DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR,
    );
    if (!filters.offset) {
      filters.offset = FIRST_OFFSET;
    }
    if (!filters.limit) {
      filters.limit = DEFAULT_LIMIT;
    }

    const { offset, limit } = filters;

    const files = await this.model.findAll({
      offset,
      limit,
      where: {
        isUse: false,
        createdAt: {
          [Op.lte]: maxAge,
        },
      },
    });
    return files.map((file) => file.get({ plain: true }));
  }
}
