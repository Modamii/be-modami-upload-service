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
  FileDto,
  FilePropertiesDto,
  FilePropsDto,
} from '../../../internal/domain/file.domain';

@Table({ tableName: 'file' })
export class FileModel
  extends Model<FileDto, Optional<FileDto, 'id'>>
  implements FileDto
{
  @PrimaryKey
  @Column
  id: string;

  @Column
  userId: string;

  @Column
  originUrl: string;

  @Column(DataTypes.JSONB)
  properties: FilePropertiesDto;

  @Column(DataTypes.JSONB)
  props: FilePropsDto;

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
