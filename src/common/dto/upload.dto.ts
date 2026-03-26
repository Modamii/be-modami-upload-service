import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Allow, IsEnum, IsString } from 'class-validator';

export enum VideoUploadType {
  // userAvatar = 'user-avatar',
  // userCover = 'user-cover',
  // groupAvatar = 'group-avatar',
  // groupCover = 'group-cover',
  // postImage = 'post-image',
  // commentImage = 'comment-image',
  postVideo = 'post_video',
  // commentVideo = 'comment-video',
}

export enum FileUploadType {
  postFile = 'post_file',
  commentFile = 'comment_file',
}

export enum ImageUploadType {
  postImage = 'post_image',
  commentImage = 'comment_image',
}

export class VideoUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Allow()
  public file: any;

  @ApiProperty({ enum: VideoUploadType, name: 'upload_type' })
  @IsString()
  @IsEnum(VideoUploadType)
  @Expose({
    name: 'upload_type',
  })
  public uploadType: VideoUploadType;
}

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Allow()
  public file: any;

  @ApiProperty({ enum: FileUploadType, name: 'upload_type' })
  @IsString()
  @IsEnum(FileUploadType)
  @Expose({
    name: 'upload_type',
  })
  public uploadType: FileUploadType;
}

export const VideoStoragePrefix = {
  [VideoUploadType.postVideo]: 'post/original',
  PostVariants: 'post/variants',
};

export const VideoThumbnailStoragePrefix = {
  [VideoUploadType.postVideo]: 'post/thumbnails',
};

export const FileStoragePrefix = {
  [FileUploadType.postFile]: 'post/original',
  [FileUploadType.commentFile]: 'comment/original',
};

export const ImageStoragePrefix = {
  [ImageUploadType.postImage]: 'post/original',
  [ImageUploadType.commentImage]: 'comment/original',
};
