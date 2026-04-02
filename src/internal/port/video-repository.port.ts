import { VideoDto, UpdateVideoDto, VideoPropertiesDto } from '../domain/video.domain';
import { UPLOAD_VIDEO_STATUS } from '../domain/video.constant';

export interface IVideoRepository {
  getById(id: string, excludeDeleted?: boolean): Promise<VideoDto>;
  getByIds(args: {
    userId?: string;
    ids: string[];
    excludeDeleted?: boolean;
  }): Promise<VideoDto[]>;
  getByIdAsUser(id: string, userId: string): Promise<VideoDto>;
  filter(filters?: {
    status?: UPLOAD_VIDEO_STATUS;
    offset?: number;
    limit?: number;
  }): Promise<VideoDto[]>;
  create(params: {
    userId: string;
    properties?: VideoPropertiesDto;
  }): Promise<VideoDto>;
  updateById(id: string, data: UpdateVideoDto): Promise<number>;
  markVideosHasBeenUsed(ids: string[]): Promise<number>;
  deleteById(id: string, userId?: string): Promise<number>;
  deleteByIds(ids: string[], userId?: string): Promise<number>;
  getVideosNotUse(filters?: {
    offset?: number;
    limit?: number;
    maxAgeInHour?: number;
  }): Promise<VideoDto[]>;
}
