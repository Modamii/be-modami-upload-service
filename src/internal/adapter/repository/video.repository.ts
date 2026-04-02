import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VideoModel } from '../../../pkg/database/models';
import { v4 as uuidV4 } from 'uuid';
import { UPLOAD_VIDEO_STATUS, CURRENT_UPLOAD_VERSION } from '../../domain/video.constant';
import { VideoDto, UpdateVideoDto, VideoPropertiesDto } from '../../domain/video.domain';
import { Exception, EXCEPTIONS } from '../../../pkg/common/exceptions';
import { ObjectHelper, TimeHelper } from '../../../pkg/common/helpers';
import { DestroyOptions, FindOptions, Op } from 'sequelize';
import { DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR } from '../../../pkg/common/constants';
import { IVideoRepository } from '../../port/video-repository.port';

@Injectable()
export class VideoRepository implements IVideoRepository {
  constructor(@InjectModel(VideoModel) private model: typeof VideoModel) {}

  async getById(id: string, excludeDeleted: boolean = true) {
    const video = await this.model.findOne({
      where: { id },
      paranoid: excludeDeleted,
    });
    if (!video) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `fileId=${id}`,
      });
    }
    return video.get({ plain: true });
  }

  async getByIds(args: {
    userId?: string;
    ids: string[];
    excludeDeleted?: boolean;
  }) {
    const { ids, userId, excludeDeleted } = args;
    const query: FindOptions<VideoDto> = { where: { id: ids } };
    if (userId) {
      query.where = { ...query.where, userId };
    }
    if (excludeDeleted === false) {
      query.paranoid = excludeDeleted;
    }

    const videos = await this.model.findAll(query);
    if (!videos.length) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `ids=${args.ids}; userId=${args.userId}`,
      });
    }
    return videos.map((e: VideoModel) => e.get({ plain: true }));
  }

  async getByIdAsUser(id: string, userId: string) {
    const video = await this.model.findOne({ where: { id, userId } });
    if (!video) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `videoId=${id}; userId=${userId}`,
      });
    }
    return video.get({ plain: true });
  }

  async filter(
    filters: {
      status?: UPLOAD_VIDEO_STATUS;
      offset?: number;
      limit?: number;
    } = {},
  ) {
    if (!filters.offset) {
      filters.offset = 0;
    }
    if (!filters.limit) {
      filters.limit = 10;
    }
    ObjectHelper.whiteList(filters, ['status', 'limit', 'offset']);

    const { offset, limit, ...otherFields } = filters;

    const videos = await this.model.findAll({
      offset,
      limit,
      where: otherFields as any,
    });
    return videos.map((video) => video.get({ plain: true }));
  }

  async create(params: { userId: string; properties?: VideoPropertiesDto }) {
    ObjectHelper.whiteList(params, ['userId', 'properties']);
    const video = await this.model.create({
      id: uuidV4(),
      status: UPLOAD_VIDEO_STATUS.INIT,
      userId: params.userId,
      version: CURRENT_UPLOAD_VERSION,
      isUse: false,
      properties: params.properties,
    });
    return video.get({ plain: true });
  }

  async updateById(id: string, data: UpdateVideoDto): Promise<number> {
    ObjectHelper.whiteList(data, [
      'originUrl',
      'status',
      'files',
      'props',
      'properties',
      'thumbnails',
      'isUse',
    ]);
    const [updatedCount] = await this.model.update(data as any, {
      where: { id },
    });
    return updatedCount;
  }

  async markVideosHasBeenUsed(ids: string[]) {
    const [updatedCount] = await this.model.update(
      { isUse: true },
      {
        where: { id: ids },
      },
    );
    return updatedCount;
  }

  async deleteById(id: string, userId?: string): Promise<number> {
    const query: DestroyOptions<VideoDto> = { where: { id } };
    if (userId) {
      query.where = { ...query.where, userId };
    }

    const deletedCount = await this.model.destroy(query);
    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `videoId=${id}; userId=${userId}`,
      });
    }
    return deletedCount;
  }

  async deleteByIds(ids: string[], userId?: string): Promise<number> {
    const query: DestroyOptions<VideoDto> = { where: { id: ids } };
    if (userId) {
      query.where = { ...query.where, userId };
    }

    const deletedCount = await this.model.destroy(query);
    if (deletedCount == 0) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `ids=${ids}; userId=${userId}`,
      });
    }
    return deletedCount;
  }

  async getVideosNotUse(
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
      filters.offset = 0;
    }
    if (!filters.limit) {
      filters.limit = 10;
    }

    const { offset, limit } = filters;

    const videos = await this.model.findAll({
      offset,
      limit,
      where: {
        isUse: false,
        createdAt: {
          [Op.lte]: maxAge,
        },
      },
    });
    return videos.map((video) => video.get({ plain: true }));
  }
}
