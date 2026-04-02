import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions } from 'sequelize';
import { v4 as uuidV4 } from 'uuid';

import { ImageModel } from '../../../pkg/database/models';
import { CURRENT_UPLOAD_IMAGE_VERSION } from '../../domain/image.constant';
import { Exception, EXCEPTIONS } from '../../../pkg/common/exceptions';
import { ObjectHelper } from '../../../pkg/common/helpers';
import { DEFAULT_LIMIT, FIRST_OFFSET } from '../../../pkg/common/constants';
import {
  CreateImageDto,
  ImageDto,
  ImagePropertiesDto,
  IMAGE_STATUS,
} from '../../domain/image.domain';
import { ImagePath } from '../../domain/image.helper';
import { IImageRepository } from '../../port/image-repository.port';

@Injectable()
export class ImageRepository implements IImageRepository {
  constructor(@InjectModel(ImageModel) private model: typeof ImageModel) {}

  async getById(id: string, excludeDeleted: boolean = true) {
    const image = await this.model.findOne({
      where: { id },
      paranoid: excludeDeleted,
    });
    if (!image) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
        detailedError: `imageId=${id}`,
      });
    }
    return image.get({ plain: true });
  }

  async getByIds(args: {
    ids: string[];
    userId?: string;
    excludeDeleted?: boolean;
  }) {
    const { ids, userId, excludeDeleted } = args;
    const query: FindOptions<ImageDto> = { where: { id: ids } };
    if (userId) {
      query.where = { ...query.where, userId };
    }
    if (excludeDeleted === false) {
      query.paranoid = excludeDeleted;
    }

    const images = await this.model.findAll(query);
    if (!images.length) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
        detailedError: `ids=${args.ids}`,
      });
    }
    return images.map((e: ImageModel) => e.get({ plain: true }));
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

    const images = await this.model.findAll({
      offset,
      limit,
    });
    return images.map((image) => image.get({ plain: true }));
  }

  async create(userId: string, createImageDto: CreateImageDto) {
    const uuid = uuidV4();
    const imagePath = new ImagePath(createImageDto.resource, uuid, false);
    const image = await this.model.create({
      id: uuid,
      userId: userId,
      version: CURRENT_UPLOAD_IMAGE_VERSION,
      isUse: true,
      status: IMAGE_STATUS.INIT,
      path: imagePath.getOriginPath(),
      ...createImageDto,
    });
    return image.get({ plain: true });
  }

  /**
   * @deprecated
   */
  async createMigrate(imageId: string, path: string) {
    const image = await this.model.create({
      id: imageId,
      userId: 'unknown',
      version: CURRENT_UPLOAD_IMAGE_VERSION,
      isUse: true,
      status: IMAGE_STATUS.MIGRATING,
      path: path,
    });
    return image.get({ plain: true });
  }

  /**
   * @deprecated
   */
  async createWithImageId(
    userId: string,
    imageId: string,
    createImageDto: CreateImageDto,
  ) {
    const image = await this.model.create({
      id: imageId,
      userId: userId,
      version: CURRENT_UPLOAD_IMAGE_VERSION,
      isUse: true,
      status: IMAGE_STATUS.INIT,
      ...createImageDto,
    });
    return image.get({ plain: true });
  }

  async updateById(
    id: string,
    data: {
      path?: string;
      properties?: ImagePropertiesDto;
      isUse?: boolean;
      status?: string;
      resource?: string;
      userId?: string;
      errorCode?: string;
    },
  ): Promise<number> {
    const [updatedCount] = await this.model.update(data, {
      where: { id },
    });
    return updatedCount;
  }

  async deleteById(id: string, userId?: string): Promise<number> {
    const where = { id };
    if (userId) {
      where['userId'] = userId;
    }
    const deletedCount = await this.model.destroy({
      where: where,
    });
    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
        detailedError: `id=${id}; userId=${userId}`,
      });
    }
    return deletedCount;
  }

  async deleteByIds(ids: string[], userId?: string): Promise<number> {
    const where = { id: ids };
    if (userId) {
      where['userId'] = userId;
    }

    const deletedCount = await this.model.destroy({
      where: where,
    });

    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
        detailedError: `ids=${ids}; userId=${userId}`,
      });
    }
    return deletedCount;
  }
}
