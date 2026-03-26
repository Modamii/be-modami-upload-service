import { Logger } from '@nestjs/common';
import pathToFfmpeg from 'ffmpeg-static';
import FfmpegCommand from 'fluent-ffmpeg';
import path from 'path';
import sharp from 'sharp';

import {
  getUploadTempPath,
  RunFfmpeg,
  deleteFile,
  Metadata,
  MetadataHelper,
} from '../common/helpers';
import {
  JPG_EXTENSION,
  THUMBNAIL_OPTIMIZE_QUALITY,
  THUMBNAIL_POSITION_PERCENT,
  THUMBNAIL_RESOLUTIONS,
  THUMBNAIL_SMALL_DURATION_SEEK_TIME,
} from './videos.constant';
import fs from 'fs';
import * as axios from 'axios';
import { promisify } from 'util';
import * as stream from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { Exception, EXCEPTIONS } from 'src/common/exceptions';
import {
  FileStoragePrefix,
  FileUploadType,
  ImageStoragePrefix,
  ImageUploadType,
  VideoStoragePrefix,
  VideoThumbnailStoragePrefix,
  VideoUploadType,
} from 'src/common/dto';
import { VideoMimetype, VideoPropertiesDto } from './dto';

const HLS_EXTENSION = '.m3u8';

export class VideoPath {
  constructor(
    private videoId: string,
    private properties?: VideoPropertiesDto,
  ) {}

  getSuffixFromMimeType(mimeType = VideoMimetype.mp4) {
    return mimeType.split('/').pop();
  }

  getOriginPath() {
    const suffix = this.getSuffixFromMimeType(
      <VideoMimetype>this.properties?.mimeType,
    );
    return `${VideoStoragePrefix[VideoUploadType.postVideo]}/${
      this.videoId
    }.${suffix}`;
  }
}

export class VideoHelper {
  static async downloadRemoteVideo(
    mp4Url: string,
    fullPath: string,
  ): Promise<{ path: string }> {
    const finishedDownload = promisify(stream.finished);
    const writer = fs.createWriteStream(fullPath);

    const response = await axios.default({
      method: 'GET',
      url: mp4Url,
      responseType: 'stream',
    });

    response.data.pipe(writer);
    await finishedDownload(writer);

    return { path: fullPath };
  }

  /**
   * Get Hls Url
   * @param hlsPrefixUrl: string example https://""m.com/videos
   * @param videoId upload id
   * @returns 'http://....'
   */
  static getHlsUrl(hlsPrefixUrl: string, videoId: string): string {
    const url = new URL(videoId + HLS_EXTENSION, hlsPrefixUrl).href;
    return url;
  }

  static getOriginVideoS3Key(
    videoUploadType: VideoUploadType,
    option?: { suffix?: string; videoId?: string },
  ) {
    const _uuid = option?.videoId || uuidv4();
    const prefix = VideoStoragePrefix[videoUploadType];
    if (!prefix) {
      throw new Exception(EXCEPTIONS.VIDEO.GEN_S3_FAILED).withFields({});
    }
    return `${prefix}/${_uuid}${option?.suffix}`;
  }

  static getTranscodedS3Key(videoId: string, quality: string) {
    const prefix = VideoStoragePrefix.PostVariants;
    if (!prefix) {
      throw new Exception(EXCEPTIONS.VIDEO.GEN_S3_FAILED).withFields({});
    }
    return `${prefix}/${videoId}_${quality}.mp4`;
  }

  static getVideoThumbnailS3Key(
    videoUploadType: VideoUploadType,
    option?: {
      suffix?: string;
      videoId?: string;
    },
  ) {
    const _uuid = option?.videoId || uuidv4();
    const prefix = VideoThumbnailStoragePrefix[videoUploadType];
    if (!prefix) {
      throw new Exception(EXCEPTIONS.VIDEO.GEN_S3_FAILED).withFields({});
    }
    return `${prefix}/${_uuid}${option?.suffix}`;
  }

  static getOriginFileS3Key(
    fileUploadType: FileUploadType,
    option?: { suffix?: string; fileId?: string },
  ) {
    const _uuid = option?.fileId || uuidv4();
    const prefix = FileStoragePrefix[fileUploadType];
    if (!prefix) {
      throw new Exception(EXCEPTIONS.VIDEO.GEN_S3_FAILED).withFields({});
    }
    return `${prefix}/${_uuid}${option?.suffix || ''}`;
  }

  static getOriginImageS3Key(
    imageUploadType: ImageUploadType,
    option?: { suffix?: string; videoId?: string },
  ) {
    const _uuid = option?.videoId || uuidv4();
    const prefix = ImageStoragePrefix[imageUploadType];
    if (!prefix) {
      throw new Exception(EXCEPTIONS.VIDEO.GEN_S3_FAILED).withFields({});
    }
    return `${prefix}/${_uuid}${option?.suffix}`;
  }

  public static getVideoIdFromPath(path: string): string {
    const uuidRegexp =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
    const listIds = path.match(uuidRegexp);
    if (Array.isArray(listIds) && listIds.length > 0) {
      return listIds[0];
    }
    return '';
  }
}

export class ThumbnailHelper {
  static async generateThumbnail(
    fullPath: string,
    videoId: string,
    metadata?: Metadata,
  ) {
    const result: { width: number; height: number; path: string }[] = [];
    if (!metadata) {
      metadata = await MetadataHelper.getMetadataVideo(fullPath);
    }
    let thumbnailSeekTime = metadata.getDuration() * THUMBNAIL_POSITION_PERCENT;
    if (thumbnailSeekTime < THUMBNAIL_SMALL_DURATION_SEEK_TIME) {
      thumbnailSeekTime = 0;
    }
    const thumbnailPath = path.join(
      getUploadTempPath(),
      `${videoId}.${JPG_EXTENSION}`,
    );
    const ffmpeg = FfmpegCommand();
    ffmpeg.setFfmpegPath(pathToFfmpeg);
    ffmpeg
      .addInput(fullPath)
      .addInputOptions(['-ss', String(thumbnailSeekTime)])
      .addOutput(thumbnailPath)
      .addOutputOptions(['-vframes', '1']);

    await RunFfmpeg(ffmpeg);
    const timeStartFunc = new Date().getTime();
    const promises = [];
    for (const size of THUMBNAIL_RESOLUTIONS) {
      const { width, height } = metadata.getWidthHeightAfterResize({
        height: size,
      });
      const thumbPath = path.join(
        getUploadTempPath(),
        `${videoId}_${width}x${height}.jpg`,
      );

      promises.push(
        sharp(thumbnailPath)
          .resize({ height })
          .jpeg({ quality: THUMBNAIL_OPTIMIZE_QUALITY })
          .toFile(thumbPath),
      );
      result.push({ width, height, path: thumbPath });
    }
    await Promise.all(promises);

    deleteFile(thumbnailPath);
    const executionTime = new Date().getTime() - timeStartFunc;
    Logger.debug({
      message: 'resize thumbnail success',
      videoId,
      executionTime,
    });
    return result;
  }
}
