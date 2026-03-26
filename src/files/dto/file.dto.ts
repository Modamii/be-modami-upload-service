import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FilePropsDto {
  postId?: string;
}

export class FilePropertiesDto {
  @ApiProperty()
  @Expose()
  name?: string;

  @ApiProperty({ name: 'mime_type' })
  @Expose({ name: 'mime_type' })
  mimeType?: string;

  @ApiProperty()
  @Expose()
  size?: number;
}

export class FileDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  userId: string;

  @ApiProperty({ name: 'origin_url' })
  @Expose({ name: 'origin_url' })
  originUrl: string;

  @ApiProperty()
  @Expose()
  @Type(() => FilePropertiesDto)
  properties: FilePropertiesDto;

  props?: FilePropsDto;

  isUse?: boolean;

  version: string;

  @ApiProperty({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt?: Date;

  updatedAt?: Date;
  deletedAt?: Date;
}
