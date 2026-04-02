import { FileDto } from '../domain/file.domain';

export interface IFileRepository {
  getById(id: string, excludeDeleted?: boolean): Promise<FileDto>;
  getByIds(args: {
    ids: string[];
    userId?: string;
    excludeDeleted?: boolean;
  }): Promise<FileDto[]>;
  getByIdAsUser(id: string, userId: string): Promise<FileDto>;
  filter(filters?: { offset?: number; limit?: number }): Promise<FileDto[]>;
  create(params: { userId: string }): Promise<FileDto>;
  updateById(
    id: string,
    data: { originUrl: string; properties: {}; isUse?: boolean },
  ): Promise<number>;
  deleteById(id: string, userId?: string): Promise<number>;
  deleteByIds(ids: string[], userId?: string): Promise<number>;
  markFilesHasBeenUsed(ids: string[]): Promise<number>;
  getFilesNotUse(filters?: {
    offset?: number;
    limit?: number;
    maxAgeInHour?: number;
  }): Promise<FileDto[]>;
}
