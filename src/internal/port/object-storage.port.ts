import { PresignedPostDto } from '../domain/image.domain';
import { VideoUploadType } from '../dto';

export interface IObjectStoragePort {
  getPresignedUrl(
    path: string,
    bucket: string,
    options?: {
      contentType?: string;
      ExpiresInSecond?: number;
    },
  ): Promise<string>;

  getDownloadImagePresignedUrl(
    path: string,
    options?: {
      ExpiresInSecond?: number;
    },
  ): Promise<string>;

  createPresignedPost(
    path: string,
    bucket: string,
    options?: {
      contentType?: string;
      ExpiresInSecond?: number;
      limitSize?: number;
    },
  ): Promise<PresignedPostDto>;

  downloadVideoFromS3(s3Key: string, localPath: string): Promise<void>;

  downloadExternalUrl(url: string, localPath: string): Promise<void>;

  upload(
    localPath: any,
    path: string,
    options?: {
      ContentDisposition?: string;
      CacheControl?: string;
      ContentType?: string;
    },
  ): Promise<void>;

  download(path: string, localPath: string): Promise<void>;

  getBucketByPath(path: string): string;

  uploadOriginVideo(
    localPath: string,
    videoId: string,
    originalName: string,
    resource: VideoUploadType,
  ): Promise<{ src: string }>;

  uploadVariantVideo(
    remoteUrl: string,
    videoId: string,
    quality: string,
  ): Promise<{ src: string }>;

  uploadThumbnailToS3(path: string, key: string): Promise<{ src: string }>;

  uploadFileToS3(
    path: string,
    key: string,
    originalName: string,
  ): Promise<{ src: string }>;

  uploadImageToS3(path: string, key: string): Promise<{ src: string }>;

  deleteVideos(urls: string[]): Promise<void>;

  deleteThumbnails(urls: string[]): Promise<void>;

  deleteFiles(paths: string[]): Promise<void>;

  deleteImages(keys: string[]): Promise<void>;

  deleteEKycs(keys: string[]): Promise<void>;

  copyObject(sourcePath: string, destinationPath: string): Promise<any>;
}
