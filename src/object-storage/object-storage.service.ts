import { Resource } from './../images/dto/image.dto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import fs from 'fs';
import * as contentDisposition from 'content-disposition';
import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import s3ParseUrl from 's3-url-parser';
import { Retryable, BackOffPolicy } from 'typescript-retry-decorator';
import * as axios from 'axios';
import * as stream from 'stream';
import { promisify } from 'util';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

import { deleteFile } from '../common/helpers';

import { AwsS3Config } from '../configs/config.interface';
import { VideoUploadType } from '../common/dto/upload.dto';
import {
  DELETE_OBJECT_BULK_SIZE_IN_NUMBER,
  DOWNLOAD_EXTERNAL_TIMEOUT,
} from './object-storage.constant';
import { PresignedPostDto } from '../images/dto';
import { STATUS_NOT_RETRY } from '../common/constants';
import { IMAGE_PRESIGNED_URL_EXPIRED } from 'src/images/images.constant';
import { Exception, EXCEPTIONS } from 'src/common/exceptions';
import { VideoHelper } from 'src/videos/videos.helper';

const finished = promisify(stream.finished);

@Injectable()
export class ObjectStorageService {
  private logger = new Logger(ObjectStorageService.name);
  private s3: S3;
  private s3Client: S3Client;
  private s3Config: AwsS3Config;
  private tempPath: string;
  constructor(private configService: ConfigService) {
    this.s3Config = this.configService.get<AwsS3Config>('s3');
    this.s3 = new S3({
      accessKeyId: this.s3Config.accessKeyId,
      secretAccessKey: this.s3Config.secretAccessKey,
      region: this.s3Config.region || 'us-east-1',
      endpoint: this.s3Config.endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
    this.s3Client = new S3Client({
      region: this.s3Config.region || 'us-east-1',
      endpoint: this.s3Config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
    });
    this.tempPath = this.configService.get<string>('tempPath');
  }

  async getPresignedUrl(
    path: string,
    bucket: string,
    options?: {
      contentType?: string;
      ExpiresInSecond?: number;
    },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isEKycBucket(path)) {
        bucket = this.s3Config.eKycBucket;
      }
      const params = {
        Bucket: bucket,
        Key: path,
        Expires: options.ExpiresInSecond || IMAGE_PRESIGNED_URL_EXPIRED, // second; expiry start upload
        // ACL: S3_ACL, //private, public-read, public-read-write, authenticated-read,... https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html
        // ContentLength: options.size,
      };

      if (options?.contentType) {
        params['ContentType'] = options.contentType;
      }
      this.s3
        .getSignedUrlPromise('putObject', params)
        .then(resolve)
        .catch(reject);
    });
  }

  async getDownloadImagePresignedUrl(
    path: string,
    options?: {
      ExpiresInSecond?: number;
    },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let bucket = this.s3Config.userUploadImagesBucket;
      if (this.isEKycBucket(path)) {
        bucket = this.s3Config.eKycBucket;
      }
      const params = {
        Bucket: bucket,
        Key: path,
        Expires: options?.ExpiresInSecond || IMAGE_PRESIGNED_URL_EXPIRED, // second; expiry start upload
        // ACL: S3_ACL, //private, public-read, public-read-write, authenticated-read,... https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html
        // ContentLength: options.size,
      };

      this.s3
        .getSignedUrlPromise('getObject', params)
        .then(resolve)
        .catch(reject);
    });
  }

  async createPresignedPost(
    path: string,
    bucket: string,
    options?: {
      contentType?: string;
      ExpiresInSecond?: number;
      limitSize?: number;
    },
  ): Promise<PresignedPostDto> {
    return new Promise((resolve, reject) => {
      if (this.isEKycBucket(path)) {
        bucket = this.s3Config.eKycBucket;
      }
      this.s3.createPresignedPost(
        {
          Bucket: bucket,
          Expires: options?.ExpiresInSecond || 10,
          Conditions: [
            [
              'content-length-range',
              1,
              (options?.limitSize || 25) * 1024 * 1024,
            ],
          ],
          Fields: { key: path },
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        },
      );
    });
  }

  async downloadVideoFromS3(s3Key: string, localPath: string): Promise<void> {
    // https://gist.github.com/milesrichardson/db724faf7615f0ea208590a52da2c0eb
    const writeStream = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
      this.s3
        .getObject({
          Bucket: this.s3Config.userUploadVideosBucket,
          Key: s3Key,
        })
        .createReadStream()
        .pipe(writeStream)
        .on('close', () => {
          writeStream.close();
          return resolve();
        })
        .on('error', (err) => {
          this.logger.log({
            message: 'download file from S3 failed',
            error: err,
            key: s3Key,
          });
          writeStream.close();
          return reject(err);
        });
    });
  }

  @Retryable({
    maxAttempts: 4,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 10000, multiplier: 3 },
    doRetry: (e: Error) => {
      const willDoRetry = !STATUS_NOT_RETRY.some((status) =>
        e.message?.includes(String(status)),
      );
      return willDoRetry;
    },
  })
  async downloadExternalUrl(url: string, localPath: string): Promise<void> {
    // Reference https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile
    // https://stackoverflow.com/questions/36690451/timeout-feature-in-the-axios-library-is-not-working
    const writer = fs.createWriteStream(localPath);
    const source = axios.default.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel();
    }, DOWNLOAD_EXTERNAL_TIMEOUT);
    return axios.default
      .request({
        method: 'get',
        url: url,
        responseType: 'stream',
        cancelToken: source.token,
      })
      .then((response) => {
        response.data.pipe(writer);
        return finished(writer); //this is a Promise
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 10000, multiplier: 3 },
  })
  async upload(
    localPath: any,
    path: string,
    options?: {
      ContentDisposition?: string;
      CacheControl?: string;
      ContentType?: string;
    },
  ): Promise<void> {
    const fileContent = fs.createReadStream(localPath);
    try {
      const stat = fs.statSync(localPath);
      const payload = {
        Bucket: this.getBucketByPath(path),
        Body: fileContent,
        Key: path,
        ContentLength: stat.size,
      };
      if (options?.ContentDisposition) {
        payload['ContentDisposition'] = contentDisposition.default(
          options.ContentDisposition,
          { fallback: false },
        );
      }
      if (options?.ContentType) {
        payload['ContentType'] = options.ContentType;
      }
      if (options?.CacheControl) {
        payload['CacheControl'] = options.CacheControl;
      }
      await this.s3.upload(payload).promise();
    } catch (err) {
      this.logger.log({
        message: 'upload file to S3 failed',
        error: err,
        path,
      });
      throw err;
    } finally {
      fileContent.close();
    }
  }

  async download(path: string, localPath: string): Promise<void> {
    const writeStream = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
      this.s3
        .getObject({
          Bucket: this.getBucketByPath(path),
          Key: path,
        })
        .createReadStream()
        .pipe(writeStream)
        .on('close', () => {
          writeStream.close();
          return resolve();
        })
        .on('error', (err) => {
          this.logger.log({
            message: 'download file from S3 failed',
            error: err,
            key: path,
          });
          writeStream.close();
          return reject(err);
        });
    });
  }

  getBucketByPath(path: string): string {
    if (this.isVideoBucket(path)) {
      return this.s3Config.userUploadVideosBucket;
    }
    if (this.isEKycBucket(path)) {
      return this.s3Config.eKycBucket;
    }
    if (this.isImageBucket(path)) {
      return this.s3Config.userUploadImagesBucket;
    }
    if (this.isFileBucket(path)) {
      return this.s3Config.userUploadFilesBucket;
    }
    throw new Exception(EXCEPTIONS.BUCKET.NOT_FOUND).withFields({});
  }

  isVideoBucket(path: string): boolean {
    const arrRegex = [/video/];
    for (const regex of arrRegex) {
      if (path.match(regex)) {
        return true;
      }
    }
    return false;
  }

  isImageBucket(path: string): boolean {
    const arrRegex = [/image/];
    for (const regex of arrRegex) {
      if (path.match(regex)) {
        return true;
      }
    }
    return false;
  }

  isEKycBucket(path: string): boolean {
    const arrRegex = [`image/\\w+\\/${Resource.eKyc}`];
    for (const regex of arrRegex) {
      if (path.match(regex)) {
        return true;
      }
    }
    return false;
  }

  isFileBucket(path: string): boolean {
    const arrRegex = [/file/];
    for (const regex of arrRegex) {
      if (path.match(regex)) {
        return true;
      }
    }
    return false;
  }

  async uploadOriginVideo(
    localPath: string,
    videoId: string,
    originalName: string,
    resource: VideoUploadType,
  ): Promise<{ src: string }> {
    const key = VideoHelper.getOriginVideoS3Key(resource, {
      suffix: path.extname(originalName),
      videoId: videoId,
    });
    return await this.uploadToS3(
      this.s3Config.userUploadVideosBucket,
      localPath,
      key,
    );
  }

  async uploadVariantVideo(
    remoteUrl: string,
    videoId: string,
    quality: string,
  ): Promise<{ src: string }> {
    const fileTempPath = path.join(this.tempPath, uuidV4());
    try {
      await VideoHelper.downloadRemoteVideo(remoteUrl, fileTempPath);
      const s3Key = VideoHelper.getTranscodedS3Key(videoId, quality);
      const { src } = await this.uploadToS3(
        this.s3Config.userUploadVideosBucket,
        fileTempPath,
        s3Key,
      );
      deleteFile(fileTempPath);
      return { src };
    } catch (error) {
      deleteFile(fileTempPath);
      throw error;
    }
  }

  async uploadThumbnailToS3(
    path: string,
    key: string,
  ): Promise<{ src: string }> {
    return this.uploadToS3(this.s3Config.userUploadVideosBucket, path, key);
  }

  async uploadFileToS3(
    path: string,
    key: string,
    originalName: string,
  ): Promise<{ src: string }> {
    return this.uploadToS3(
      this.s3Config.userUploadFilesBucket,
      path,
      key,
      originalName,
    );
  }

  async uploadImageToS3(path: string, key: string): Promise<{ src: string }> {
    return this.uploadToS3(this.s3Config.userUploadImagesBucket, path, key);
  }

  private async uploadToS3(
    bucket: string,
    fullPath: string,
    key: string,
    originalName?: string,
  ) {
    const fileContent = fs.createReadStream(fullPath);
    try {
      const stat = fs.statSync(fullPath);
      const payload = {
        Bucket: bucket,
        Body: fileContent,
        Key: key,
        ContentLength: stat.size,
      };
      if (originalName) {
        payload['ContentDisposition'] = contentDisposition.default(
          originalName,
          { fallback: false },
        );
      }
      const res = await this.s3.upload(payload).promise();
      return { src: res.Location };
    } catch (err) {
      this.logger.log({ message: 'upload file to S3 failed', error: err, key });
      throw err;
    } finally {
      fileContent.close();
    }
  }

  async deleteVideos(urls: string[]) {
    const bucket = this.s3Config.userUploadVideosBucket;
    await this.bulkDeleteByUrls(bucket, urls);
  }

  async deleteThumbnails(urls: string[]) {
    const bucket = this.s3Config.userUploadVideosBucket;
    await this.bulkDeleteByUrls(bucket, urls);
  }

  async deleteFiles(paths: string[]) {
    const bucket = this.s3Config.userUploadFilesBucket;
    await this.bulkDeleteByUrls(bucket, paths);
  }

  async deleteImages(keys: string[]) {
    const bucket = this.s3Config.userUploadImagesBucket;
    await this.bulkDeleteByKeys(bucket, keys);
  }

  async deleteEKycs(keys: string[]) {
    const bucket = this.s3Config.eKycBucket;
    await this.bulkDeleteByKeys(bucket, keys);
  }

  private parseKeyFromUrl(url: string, bucket: string): string {
    // Try s3:// format first (legacy AWS S3 URLs)
    const s3Parsed = s3ParseUrl(url);
    if (s3Parsed?.key) return s3Parsed.key;

    // Handle HTTP/HTTPS path-style URLs (MinIO: http://host/bucket/key)
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === bucket) {
        return parts.slice(1).join('/');
      }
      return parts.join('/');
    } catch {
      return url;
    }
  }

  private async bulkDeleteByUrls(bucket: string, urls: string[]) {
    const keys = urls.map((url) => this.parseKeyFromUrl(url, bucket));
    this.bulkDeleteByKeys(bucket, keys);
  }

  private async bulkDeleteByKeys(bucket: string, keys: string[]) {
    // Reference https://stackoverflow.com/questions/8495687/split-array-into-chunks
    for (let i = 0; i < keys.length; i += DELETE_OBJECT_BULK_SIZE_IN_NUMBER) {
      const chunk = keys.slice(i, i + DELETE_OBJECT_BULK_SIZE_IN_NUMBER);
      await this.deleteObjects(bucket, chunk);
    }
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 4000, multiplier: 3 },
  })
  private async deleteObjects(bucket: string, keys: string[]) {
    const objKeys = keys.map((key) => {
      return {
        Key: key,
      };
    });
    return this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objKeys },
      }),
    );
  }

  async copyObject(sourcePath: string, destinationPath: string) {
    const res = await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.getBucketByPath(destinationPath),
        CopySource: `/${this.getBucketByPath(sourcePath)}/${sourcePath}`,
        Key: destinationPath,
      }),
    );
    return res;
  }
}
