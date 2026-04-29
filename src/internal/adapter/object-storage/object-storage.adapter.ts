import { Injectable } from '@nestjs/common';
import { ObjectStorageService } from '../../../pkg/object-storage/object-storage.service';
import { IObjectStoragePort } from '../../port/object-storage.port';
import { PresignedPostDto } from '../../domain/image.domain';

@Injectable()
export class ObjectStorageAdapter implements IObjectStoragePort {
  constructor(private readonly storageService: ObjectStorageService) {}

  getPresignedUrl(path: string, bucket: string, options?: { contentType?: string; ExpiresInSecond?: number }): Promise<string> {
    return this.storageService.getPresignedUrl(path, bucket, options);
  }

  getDownloadImagePresignedUrl(path: string, options?: { ExpiresInSecond?: number }): Promise<string> {
    return this.storageService.getDownloadImagePresignedUrl(path, options);
  }

  createPresignedPost(path: string, bucket: string, options?: { contentType?: string; ExpiresInSecond?: number; limitSize?: number }): Promise<PresignedPostDto> {
    return this.storageService.createPresignedPost(path, bucket, options);
  }

  downloadExternalUrl(url: string, localPath: string): Promise<void> {
    return this.storageService.downloadExternalUrl(url, localPath);
  }

  upload(localPath: any, path: string, options?: { ContentDisposition?: string; CacheControl?: string; ContentType?: string }): Promise<void> {
    return this.storageService.upload(localPath, path, options);
  }

  download(path: string, localPath: string): Promise<void> {
    return this.storageService.download(path, localPath);
  }

  getBucketByPath(path: string): string {
    return this.storageService.getBucketByPath(path);
  }

  uploadFileToS3(path: string, key: string, originalName: string): Promise<{ src: string }> {
    return this.storageService.uploadFileToS3(path, key, originalName);
  }

  uploadImageToS3(path: string, key: string): Promise<{ src: string }> {
    return this.storageService.uploadImageToS3(path, key);
  }

  deleteFiles(paths: string[]): Promise<void> {
    return this.storageService.deleteFiles(paths);
  }

  deleteImages(keys: string[]): Promise<void> {
    return this.storageService.deleteImages(keys);
  }

  deleteEKycs(keys: string[]): Promise<void> {
    return this.storageService.deleteEKycs(keys);
  }

  copyObject(sourcePath: string, destinationPath: string): Promise<any> {
    return this.storageService.copyObject(sourcePath, destinationPath);
  }
}
