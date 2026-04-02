import { ApiProperty, PickType, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  Allow,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';

export enum Resource {
  postContent = 'post:content',
  articleContent = 'article:content',
  articleCover = 'article:cover',
  commentContent = 'comment:content',
  seriesCover = 'series:cover',
  userAvatar = 'user:avatar',
  userCover = 'user:cover',
  groupAvatar = 'group:avatar',
  groupCover = 'group:cover',
  badge = 'badge',
  report = 'report',
  eKyc = 'ekyc',
}

export enum ImageMimetype {
  avif = 'image/avif',
  gif = 'image/gif',
  jpg = 'image/jpg',
  jpeg = 'image/jpeg',
  png = 'image/png',
  svg = 'image/svg+xml',
  webp = 'image/webp',
  bmp = 'image/bmp',
  ico = 'image/x-icon',
  ico2 = 'image/vnd.microsoft.icon',
  tiff = 'image/tiff',
  heic = 'image/heic',
  heif = 'image/heif',
}

export enum IMAGE_STATUS {
  INIT = 'INIT',
  DONE = 'DONE',
  ERROR = 'ERROR',
  MIGRATING = 'MIGRATING',
  ENCRYPTED = 'ENCRYPTED',
}

export interface DeleteOpts {
  ignoreDeleteS3?: boolean;
}

export class ImagePropsDto {
  @Allow()
  postId?: string;
}

export class ImagePropertiesDto {
  @ApiProperty({ name: 'mime_type', default: 'image/jpeg' })
  @Expose({ name: 'mime_type' })
  @IsString()
  mimeType?: string;

  @ApiProperty()
  @Expose()
  @IsInt()
  @Min(1)
  @Max((parseInt(process.env.MAX_IMAGE_SIZE_IN_MB) || 25) * 1024 * 1024)
  size?: number;

  @ApiProperty()
  @Expose({ groups: ['get'] })
  @IsInt()
  width?: number;

  @ApiProperty()
  @Expose({ groups: ['get'] })
  @IsInt()
  height?: number;

  @ApiProperty()
  @Expose({ groups: ['get'] })
  @IsBoolean()
  isAnimation?: boolean;
}

export class CreateImagePropertiesDto {
  @ApiProperty({
    name: 'mime_type',
    default: 'image/jpeg',
    enum: ImageMimetype,
  })
  @Expose({ name: 'mime_type' })
  @IsEnum(ImageMimetype)
  mimeType?: string;
}

export class PresignedPostDto {
  @ApiProperty()
  @Expose()
  @IsString()
  url: string;

  @ApiProperty()
  @Expose()
  @Allow()
  fields: object;
}

export class ImageDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  @IsString()
  userId: string;

  @ApiProperty({ name: 'url' })
  @Expose({ name: 'url', groups: ['get'] })
  @IsString()
  url?: string;

  @ApiProperty()
  @Expose({ groups: ['get'] })
  @IsString()
  src?: string;

  @IsString()
  path: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ImagePropertiesDto)
  @Expose()
  @IsObject()
  properties: ImagePropertiesDto;

  @IsObject()
  props?: ImagePropsDto;

  @ApiProperty()
  @Expose()
  @IsString()
  resource: string;

  @ApiProperty()
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ name: 'error_code' })
  @Expose({ name: 'error_code' })
  @IsString()
  errorCode?: string;

  @ApiProperty({ name: 'error_message' })
  @Expose({ name: 'error_message' })
  @IsString()
  errorMessage?: string;

  @IsBoolean()
  isUse?: boolean;

  @IsString()
  version: string;

  @ApiProperty({ name: 'created_at' })
  @Expose({ name: 'created_at', groups: ['create'] })
  createdAt?: Date;

  updatedAt?: Date;
  deletedAt?: Date;

  @ApiProperty({ name: 'presigned_url' })
  @Expose({ name: 'presigned_url', groups: ['internal'] })
  presignedUrl?: string;
}

export class CreateImageDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateImagePropertiesDto)
  properties: CreateImagePropertiesDto;

  @ApiProperty({ enum: Resource })
  @Expose()
  @IsString()
  @IsEnum(Resource)
  resource: Resource;
}

export class CreateImageInternalDto extends CreateImageDto {
  @ApiProperty({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;
}

export class CreateImageResponseDto extends PickType(ImageDto, [
  'id',
  'userId',
  'status',
  'properties',
  'resource',
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

export class GetImageQueryDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value == 'true' || value == true)
  @Expose()
  wait?: boolean;
}

export class ChangeImageResourceDto {
  @ApiProperty({ enum: Resource, required: false })
  @IsOptional()
  @Expose()
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({ name: 'user_id', required: false })
  @IsOptional()
  @Expose({ name: 'user_id' })
  @IsString()
  userId: string;
}

export class CopyImageDto {
  @ApiProperty({ enum: Resource })
  @IsNotEmpty()
  @Expose()
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({ name: 'user_id', required: false })
  @IsOptional()
  @Expose({ name: 'user_id' })
  @IsString()
  userId: string;
}

export class UpdateImageInternalDto extends PickType(ImageDto, [
  'userId',
] as const) {}
