import { ImageDto, ImagePropertiesDto, CreateImageDto } from '../domain/image.domain';

export interface IImageRepository {
  getById(id: string, excludeDeleted?: boolean): Promise<ImageDto>;
  getByIds(args: {
    ids: string[];
    userId?: string;
    excludeDeleted?: boolean;
  }): Promise<ImageDto[]>;
  filter(filters?: { offset?: number; limit?: number }): Promise<ImageDto[]>;
  create(userId: string, createImageDto: CreateImageDto): Promise<ImageDto>;
  createMigrate(imageId: string, path: string): Promise<ImageDto>;
  createWithImageId(
    userId: string,
    imageId: string,
    createImageDto: CreateImageDto,
  ): Promise<ImageDto>;
  updateById(
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
  ): Promise<number>;
  deleteById(id: string, userId?: string): Promise<number>;
  deleteByIds(ids: string[], userId?: string): Promise<number>;
}
