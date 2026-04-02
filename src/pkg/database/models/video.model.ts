import {
  Table,
  Column,
  Model,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { DataTypes } from 'sequelize';
import {
  VideoFilesDto,
  VideoPropertiesDto,
  IUploadPropsAttribute,
  ThumbnailDto,
  VideoDto,
} from '../../../internal/domain/video.domain';
import { UPLOAD_VIDEO_STATUS } from '../../../internal/domain/video.constant';

@Table({ tableName: 'video' })
export class VideoModel
  extends Model<VideoDto, Optional<VideoDto, 'id'>>
  implements VideoDto
{
  @PrimaryKey
  @Column
  id: string;

  @Column
  userId: string;

  @Column(DataTypes.ARRAY(DataTypes.JSONB))
  files: VideoFilesDto[];

  @Column
  originUrl: string;

  @Column
  status: UPLOAD_VIDEO_STATUS;

  @Column(DataTypes.ARRAY(DataTypes.JSONB))
  thumbnails: ThumbnailDto[];

  @Column(DataTypes.JSONB)
  properties: VideoPropertiesDto;

  @Column(DataTypes.JSONB)
  metadata: object;

  @Column(DataTypes.JSONB)
  props: IUploadPropsAttribute;

  @Column
  isUse: boolean;

  @Column
  version: string;

  @CreatedAt
  @Column
  createdAt?: Date;

  @UpdatedAt
  @Column
  updatedAt?: Date;

  @DeletedAt
  @Column
  deletedAt?: Date;
}
