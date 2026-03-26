import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { UPLOAD_VIDEO_STATUS } from '../videos.constant';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PresignedPostDto } from 'src/images/dto';

export interface IUploadPropsAttribute {
  postId?: string;
  vimeoId?: string;
  processAt?: string;
}

export class VideoFilesDto {
  @ApiProperty()
  @Expose()
  quality?: string;

  @ApiProperty()
  @Expose()
  src?: string;

  @ApiProperty()
  @Expose()
  codec?: string;

  @ApiProperty()
  @Expose()
  fps?: number;

  @ApiProperty()
  @Expose()
  size?: number;

  @ApiProperty()
  @Expose()
  width?: string;

  @ApiProperty()
  @Expose()
  height?: string;
}

export class VideoPropertiesDto {
  @ApiProperty()
  @Expose()
  name?: string;

  @ApiProperty({ name: 'mime_type' })
  @Expose({ name: 'mime_type' })
  mimeType?: string;

  @ApiProperty()
  @Expose()
  size?: number;

  videoCodec?: string;

  @ApiProperty()
  @Expose()
  width?: number;

  @ApiProperty()
  @Expose()
  height?: number;

  @ApiProperty()
  @Expose()
  duration?: number;

  fps?: number;
}

export class ThumbnailDto {
  @ApiProperty()
  @Expose()
  width: number;

  @ApiProperty()
  @Expose()
  height: number;

  @ApiProperty()
  @Expose()
  url: string;
}

export class VideoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  userId: string;

  files?: VideoFilesDto[];

  @ApiProperty({ name: 'origin_url' })
  @Expose({ name: 'origin_url' })
  originUrl: string;

  @ApiProperty({ name: 'hlsUrl' })
  @Expose({ name: 'hlsUrl', groups: ['get_internal'] })
  hlsUrl?: string;

  @ApiProperty()
  @Expose()
  status: UPLOAD_VIDEO_STATUS;

  @ApiProperty()
  @Expose()
  @Type(() => ThumbnailDto)
  thumbnails: ThumbnailDto[];

  @ApiProperty()
  @Expose()
  @Type(() => VideoPropertiesDto)
  properties: VideoPropertiesDto;

  metadata?: object;

  props?: IUploadPropsAttribute;
  isUse: boolean;
  version: string;

  @ApiProperty({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt?: Date;

  updatedAt?: Date;
  deletedAt?: Date;
}

export class UpdateVideoDto {
  originUrl?: string;

  status?: UPLOAD_VIDEO_STATUS;

  thumbnails?: ThumbnailDto[];

  properties?: VideoPropertiesDto;

  files?: VideoPropertiesDto[];

  props?: IUploadPropsAttribute;

  isUse?: boolean;
}

export class VideoProcessingEndDto {
  videoId: string;
  postId?: string;
  status: UPLOAD_VIDEO_STATUS;
  hlsUrl?: string;
  thumbnails?: ThumbnailDto[];
  properties?: VideoPropertiesDto;
}

export class CreateVideoResponseDto extends PickType(VideoDto, [
  'id',
  'userId',
  'status',
  'properties',
  'createdAt',
] as const) {
  @ApiProperty({ name: 'presigned_url' })
  @IsString()
  @Expose({ name: 'presigned_url' })
  presignedUrl?: string;

  @ApiProperty({ name: 'presigned_post' })
  @Type(() => PresignedPostDto)
  @Expose({ name: 'presigned_post', groups: ['create'] })
  presignedPost?: PresignedPostDto;
}

export class GetVideoQueryDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value == 'true' || value == true)
  @Expose()
  wait?: boolean;
}

export enum VideoMimetype {
  mp4 = 'video/mp4',
  webm = 'video/webm',
  ogg = 'video/ogg',
  mov = 'video/quicktime',
  avi = 'video/x-msvideo',
  wmv = 'video/x-ms-wmv',
  flv = 'video/x-flv',
  mkv = 'video/x-matroska',
  mpeg = 'video/mpeg',
  mpg = 'video/mpg',
  m4v = 'video/x-m4v',
  '3gp' = 'video/3gpp',
  '3g2' = 'video/3gpp2',
  ts = 'video/mp2t',
  hevc = 'video/hevc',
}

export class CreateVideoPropertiesDto {
  @ApiProperty({
    name: 'mime_type',
    default: 'vide/mp4',
    enum: VideoMimetype,
  })
  @Expose({ name: 'mime_type' })
  @IsString()
  mimeType?: string;
}

export class CreateVideoDto {
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVideoPropertiesDto)
  @Expose()
  @IsObject()
  properties: CreateVideoPropertiesDto;
}
