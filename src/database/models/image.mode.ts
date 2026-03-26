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
  ImageDto,
  ImagePropertiesDto,
  ImagePropsDto,
} from '../../images/dto/image.dto';

@Table({ tableName: 'image' })
export class ImageModel
  extends Model<ImageDto, Optional<ImageDto, 'id'>>
  implements ImageDto
{
  @PrimaryKey
  @Column
  id: string;

  @Column
  userId: string;

  @Column
  path: string;

  @Column(DataTypes.JSONB)
  properties: ImagePropertiesDto;

  @Column(DataTypes.JSONB)
  props: ImagePropsDto;

  @Column
  resource: string;

  @Column
  status: string;

  @Column
  errorCode: string;

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
