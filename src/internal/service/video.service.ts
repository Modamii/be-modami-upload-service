import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import s3ParseUrl from 's3-url-parser';

import { VimeoService } from '../../pkg/vimeo/vimeo.service';
import { IVideoRepository } from '../port/video-repository.port';
import { IObjectStoragePort } from '../port/object-storage.port';
import { IEventProducerPort } from '../port/event-producer.port';
import {
  VIDEO_REPOSITORY,
  OBJECT_STORAGE_PORT,
  EVENT_PRODUCER_PORT,
} from '../port/injection-tokens';
import {
  createPath,
  deleteFile,
  getUploadTempPath,
  Metadata,
  MetadataHelper,
} from '../../pkg/common/helpers';
import { Exception, EXCEPTIONS } from '../../pkg/common/exceptions';
import { sleep } from '../../pkg/common/helpers/test.helper';
import { randomIntFromInterval } from '../../pkg/common/helpers/general.helper';

import {
  UPLOAD_VIDEO_STATUS,
  DELETE_VIDEO_NOT_USE_BULK_SIZE_IN_NUMBER,
  VIDEO_PRESIGNED_POST_EXPIRED,
} from '../domain/video.constant';
import { EVENTS } from '../events/kafka-events';
import {
  UpdateVideoDto,
  VideoProcessingEndDto,
  ThumbnailDto,
  CreateVideoDto,
  VideoPropertiesDto,
} from '../domain/video.domain';
import { VideoUploadType, VideoStoragePrefix } from '../dto/upload.dto';
import { ThumbnailHelper, VideoHelper, VideoPath } from '../domain/video.helper';
import { AwsS3Config } from '../../pkg/configs/config.interface';

@Injectable()
export class VideoService {
  private logger: Logger;
  private tempPath: string;
  private hlsPrefixUrl: string;
  private s3Config: AwsS3Config;
  constructor(
    @Inject(EVENT_PRODUCER_PORT) private eventProducer: IEventProducerPort,
    private vimeoService: VimeoService,
    private configService: ConfigService,
    @Inject(VIDEO_REPOSITORY) private videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_PORT) private storagePort: IObjectStoragePort,
  ) {
    this.tempPath = this.configService.get<string>('tempPath');
    this.hlsPrefixUrl = this.configService.get<string>('hlsPrefixUrl');
    this.logger = new Logger(VideoService.name);
    this.vimeoService.setCallBack(
      (upliadId, vimeoId) => this.handleTranscodeDone(upliadId, vimeoId),
      (upliadId, vimeoId) => this.handleTranscodeError(upliadId, vimeoId),
    );
    this.s3Config = this.configService.get<AwsS3Config>('s3');
  }

  async getById(id: string) {
    const video = await this.videoRepository.getById(id);
    video.hlsUrl = '';
    if (video.status == UPLOAD_VIDEO_STATUS.DONE) {
      video.hlsUrl = VideoHelper.getHlsUrl(this.hlsPrefixUrl, video.id);
    }
    return video;
  }

  async getAndWaitFinish(id: string) {
    const DelayTimeInMilliseconds = 300;
    const TimeoutInMilliseconds = 30000;
    for (let i = 0; i < TimeoutInMilliseconds / DelayTimeInMilliseconds; i++) {
      const video = await this.videoRepository.getById(id);
      if (
        ![UPLOAD_VIDEO_STATUS.INIT, UPLOAD_VIDEO_STATUS.PROCESSING].includes(
          video.status,
        )
      ) {
        return video;
      }
      await sleep(DelayTimeInMilliseconds);
    }
    throw new Exception(EXCEPTIONS.VIDEO.PROCESS_VIDEO_ERROR);
  }

  async getByIds(ids: string[], userId?: string) {
    const videos = await this.videoRepository.getByIds({ userId, ids });
    for (const video of videos) {
      video.hlsUrl = '';
      if (video.status == UPLOAD_VIDEO_STATUS.DONE) {
        video.hlsUrl = VideoHelper.getHlsUrl(this.hlsPrefixUrl, video.id);
      }
    }
    return videos;
  }

  async create(userId: string) {
    const video = await this.videoRepository.create({ userId });
    return {
      id: video.id,
    };
  }

  async createV2(userId: string, body: CreateVideoDto) {
    const video = await this.videoRepository.create({
      userId,
      properties: body.properties,
    });

    const videoPath = new VideoPath(video.id, video.properties);

    const presignedUrl = await this.storagePort.getPresignedUrl(
      videoPath.getOriginPath(),
      this.s3Config.userUploadVideosBucket,
      {
        ExpiresInSecond: VIDEO_PRESIGNED_POST_EXPIRED,
      },
    );

    const presignedPost = await this.storagePort.createPresignedPost(
      videoPath.getOriginPath(),
      this.s3Config.userUploadVideosBucket,
      {
        ExpiresInSecond: VIDEO_PRESIGNED_POST_EXPIRED,
        limitSize: parseInt(process.env.MAX_VIDEO_SIZE_IN_MB),
      },
    );

    if (process.env.NODE_ENV == 'development') {
      return { presignedUrl, presignedPost, ...video };
    } else {
      return { presignedPost, ...video };
    }
  }

  async filter(filters: { status: UPLOAD_VIDEO_STATUS }) {
    return this.videoRepository.filter({ status: filters.status });
  }

  async gets() {
    return this.videoRepository.filter();
  }

  async update(id: string, updateUploadDto: UpdateVideoDto): Promise<boolean> {
    await this.videoRepository.updateById(id, updateUploadDto);
    return true;
  }

  async deleteByIds(ids: string[], userId?: string): Promise<void> {
    if (!ids || ids.length == 0) return;
    if (userId) {
      await this.validateVideosOwner(userId, ids);
    }
    await this.videoRepository.deleteByIds(ids, userId);

    this.deleteVideosInObjectStorage(ids)
      .then(() => {
        this.logger.log({ message: 'delete videos success', videoIds: ids });
      })
      .catch((error) => {
        this.logger.log({
          message: 'delete videos failed',
          videoIds: ids,
          error,
        });
      });
  }

  async markVideosHasBeenUsed(ids: string[], userId?: string): Promise<void> {
    if (userId) {
      await this.validateVideosOwner(userId, ids);
    }
    await this.videoRepository.markVideosHasBeenUsed(ids);

    this.logger.log({
      message: 'mark videos has been used success',
      videoIds: ids,
    });
  }

  async deleteVideosInObjectStorage(videoIds: string[]) {
    const videoUrls = [];
    const thumbnailUrls = [];
    const videos = await this.videoRepository.getByIds({
      ids: videoIds,
      excludeDeleted: false,
    });

    for (const video of videos) {
      // delete origin
      if (video.originUrl) {
        videoUrls.push(video.originUrl);
      }

      // delete variants
      if (video.files?.length > 0) {
        const variantVideoUrls: string[] = video.files.map((file) => {
          return file.src;
        });
        videoUrls.push(...variantVideoUrls);
      }

      // delete thumbnails
      if (video.thumbnails?.length > 0) {
        const thumbnailVideoUrls: string[] = video.thumbnails.map(
          (file) => file.url,
        );
        thumbnailUrls.push(...thumbnailVideoUrls);
      }
    }

    this.logger.verbose({
      message: 'deleteVideosInObjectStorage',
      videoUrls,
      thumbnailUrls,
    });

    if (videoUrls.length > 0) {
      await this.storagePort.deleteVideos(videoUrls);
    }

    if (thumbnailUrls.length > 0) {
      await this.storagePort.deleteThumbnails(thumbnailUrls);
    }
  }

  async validateVideosOwner(userId: string, ids: string[]): Promise<void> {
    const videos = await this.getByIds(ids, userId);
    if (videos.length != ids.length) {
      this.logger.log({
        message: 'validate owner failed',
        videoIds: ids,
        userId,
      });
      throw new Exception(EXCEPTIONS.COMMON.FORBIDDEN).withFields({
        detailedError: `userId=${userId} ids=${ids}`,
      });
    }
  }

  async getKalturaRedirectUrl(id: string, format: string) {
    // TODO handle cache here
    const video = await this.videoRepository.getById(id);
    if (!Array.isArray(video?.files) || video.files?.length == 0) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `videoId=${id}; format=${format}`,
      });
    }
    let url = `/${format}/${VideoStoragePrefix.PostVariants}/${id}_,`;
    for (const mp4Info of video.files) {
      url += mp4Info.quality + ',';
    }
    if (format == 'hls') {
      url += '.mp4.urlset/master.m3u8';
    } else {
      url += '.mp4.urlset/manifest.mpd';
    }
    return url;
  }

  async handleTranscodeDone(videoId: string, vimeoId: string) {
    try {
      // get vimeo upload info
      const { mp4Infos } = await this.vimeoService.getMp4Infos(vimeoId);
      const files: { quality: string; src: string; size: number }[] = [];

      for (const mp4Info of mp4Infos) {
        // not download origin and quality > 1080p
        if (mp4Info.rendition == 'source' || mp4Info.quality == 'uhd') {
          continue;
        }
        const { src } = await this.storagePort.uploadVariantVideo(
          mp4Info.link,
          videoId,
          mp4Info.rendition,
        );
        files.push({ quality: mp4Info.rendition, src, size: mp4Info.size });
      }
      const { props, properties, thumbnails, userId, status } =
        await this.videoRepository.getById(videoId);
      // update db
      await this.videoRepository.updateById(videoId, {
        files,
        status: UPLOAD_VIDEO_STATUS.DONE,
      });

      // public event
      if (status != UPLOAD_VIDEO_STATUS.DONE) {
        this.eventProducer.public<VideoProcessingEndDto>(
          EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
          {
            videoId,
            postId: props?.postId,
            status: UPLOAD_VIDEO_STATUS.DONE,
            hlsUrl: VideoHelper.getHlsUrl(this.hlsPrefixUrl, videoId),
            thumbnails,
            properties,
          },
        );
      } else {
        this.logger.debug({
          message: 'ignore publish event',
          videoId,
          vimeoId,
          status,
        });
      }

      // delete remote video
      this.vimeoService.delete(vimeoId);

      // write log
      const sizes = {};
      let totalSize = 0;
      for (const file of files) {
        sizes[file.quality] = file.size;
        totalSize += file.size;
      }
      let transcodeTimeInSec = 0;
      if (props.processAt) {
        transcodeTimeInSec = Math.abs(
          new Date().getTime() / 1000 -
            new Date(props.processAt).getTime() / 1000,
        );
      }
      this.logger.log({
        message: 'handle transcode done success',
        videoId,
        vimeoId,
        sizes,
        totalSize,
        transcodeTimeInSec,
        userId,
      });
    } catch (error) {
      this.logger.log({
        message: 'handle transcode done failed',
        videoId,
        vimeoId,
        error,
      });
      // TODO retry queue!
      this.handleVideoFailed(videoId).catch((e) => e);
      throw error;
    }
  }

  async handleTranscodeError(videoId: string, vimeoId?: string) {
    try {
      await this.handleVideoFailed(videoId);
      // TODO delete remote video (maybe keep video to check why error)
    } catch (error) {
      throw error;
    }
  }

  async handleVideoFailed(videoId) {
    try {
      const video = await this.videoRepository.getById(videoId);
      if (video.status == UPLOAD_VIDEO_STATUS.DONE) return; // Ignore if video process done
      // update db
      await this.videoRepository.updateById(videoId, {
        status: UPLOAD_VIDEO_STATUS.ERROR,
      });
      // public event
      this.eventProducer.public<VideoProcessingEndDto>(
        EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
        {
          videoId: video.id,
          postId: video.props?.postId,
          status: UPLOAD_VIDEO_STATUS.ERROR,
        },
      );
    } catch (error) {
      if (error.customCode == EXCEPTIONS.VIDEO.NOT_FOUND.customCode) {
        // if video_id not found => public event
        this.eventProducer.public<VideoProcessingEndDto>(
          EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
          {
            videoId: videoId,
            status: UPLOAD_VIDEO_STATUS.ERROR,
          },
        );
        return;
      }

      this.logger.log({ message: 'handleVideoFailed failed', videoId, error });
      throw error;
    }
  }

  /**
   * Start process origin video
   * @param videoId
   */
  async processing(videoId: string) {
    try {
      const video = await this.videoRepository.getById(videoId);

      // TODO handle if status is DONE
      if (video.status == UPLOAD_VIDEO_STATUS.DONE) {
        // republic event
        this.eventProducer.public<VideoProcessingEndDto>(
          EVENTS.BEIN_UPLOAD.VIDEO_PROCESSING_DONE,
          {
            videoId,
            postId: video.props?.postId,
            status: UPLOAD_VIDEO_STATUS.DONE,
            hlsUrl: VideoHelper.getHlsUrl(this.hlsPrefixUrl, videoId),
            thumbnails: video.thumbnails,
            properties: video.properties,
          },
        );
      }

      if (!video.originUrl) {
        throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND_ORIGIN_URL);
      }
      const s3Url = video.originUrl;
      // version 1: object storage use s3
      const { key } = s3ParseUrl(s3Url);
      const localFilePath = path.join(this.tempPath, `${videoId}_origin`);
      await createPath(localFilePath);
      await this.storagePort.downloadVideoFromS3(key, localFilePath);
      const { id: vimeoId } = await this.vimeoService.upload(
        videoId,
        localFilePath,
      );
      this.vimeoService.addIntervalCheckTranscodeStatus(videoId, vimeoId);
      if (!video.props) {
        video.props = {};
      }
      video.props.vimeoId = vimeoId;
      video.props.processAt = new Date().toISOString();
      this.videoRepository.updateById(videoId, {
        status: UPLOAD_VIDEO_STATUS.PROCESSING,
        props: video.props,
      });
      deleteFile(localFilePath);
      this.logger.debug({ message: 'start processing video success', videoId });
    } catch (error) {
      this.handleTranscodeError(videoId).catch((e) => e);
      this.logger.log({
        message: 'start process video failed',
        videoId,
        error,
      });
      throw error;
    }
  }

  async upload(
    userId: string,
    videoId: string,
    file: Express.Multer.File,
    videoUploadType: VideoUploadType,
  ) {
    const videoFullPath = path.join(getUploadTempPath(), file.filename);
    try {
      const video = await this.videoRepository.getByIdAsUser(videoId, userId);
      if (!video || video.status != UPLOAD_VIDEO_STATUS.INIT) {
        throw new Exception(EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED).withFields(
          {
            detailedError: `userId=${userId} videoId=${videoId}`,
          },
        );
      }

      const metadata = await MetadataHelper.getMetadataVideo(videoFullPath);
      const thumbnailRecord = await this.generateThumbnailsAndUploadToS3(
        videoId,
        videoFullPath,
        videoUploadType,
        metadata,
      );

      const s3upload = await this.storagePort.uploadOriginVideo(
        videoFullPath,
        videoId,
        file.originalname,
        videoUploadType,
      );

      // update db
      const record: UpdateVideoDto = {
        originUrl: s3upload.src,
        status: UPLOAD_VIDEO_STATUS.UPLOADED,
        thumbnails: thumbnailRecord,
        properties: {
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: metadata.getWidthAfterRotate(),
          height: metadata.getHeightAfterRotate(),
          videoCodec: metadata.getCodecName(),
          duration: metadata.getDuration(),
          fps: metadata.getFPS(),
        },
        isUse: false,
      };
      await this.videoRepository.updateById(videoId, record);
      deleteFile(videoFullPath);

      const result = { id: videoId, ...record }; // clone object support test
      delete result.originUrl;
      this.logger.log({
        message: 'upload video success',
        videoId: videoId,
        properties: record.properties,
        resource: videoUploadType,
        userId: video.userId,
      });
      return result as any;
    } catch (error) {
      deleteFile(videoFullPath);
      this.logger.log({
        message: 'upload video failed',
        videoId: videoId,
        error,
      });
      throw error;
    }
  }

  async initIntervalCheckProcessing() {
    try {
      // When start multi node, check interval will init all node, random sleep to make these public event video process done multi times
      const sleepTime = randomIntFromInterval(0, 15000);
      await sleep(sleepTime);

      const videos = await this.videoRepository.filter({
        status: UPLOAD_VIDEO_STATUS.PROCESSING,
      });
      videos.forEach((video) => {
        this.vimeoService.addIntervalCheckTranscodeStatus(
          video.id,
          video.props.vimeoId,
        );
      });
    } catch (error) {
      this.logger.warn({
        message: 'initIntervalCheckProcessing failed',
        error,
      });
    }
  }

  async generateThumbnailsAndUploadToS3(
    videoId: string,
    videoPath: string,
    videoUploadType: VideoUploadType,
    metadata?: Metadata,
  ): Promise<ThumbnailDto[]> {
    const thumbnailRecord: ThumbnailDto[] = [];
    const thumbnails = await ThumbnailHelper.generateThumbnail(
      videoPath,
      videoId,
      metadata,
    );
    const promises = [];
    for (const thumbnail of thumbnails) {
      const key = VideoHelper.getVideoThumbnailS3Key(videoUploadType, {
        suffix: `_${thumbnail.width}x${thumbnail.height}.jpg`,
        videoId,
      });
      const s3upload = this.storagePort.uploadThumbnailToS3(
        thumbnail.path,
        key,
      );
      promises.push(s3upload);
    }
    const s3uploads = await Promise.all(promises);
    for (let i = 0; i < thumbnails.length; i++) {
      const { width, height, path } = thumbnails[i];
      const { src } = s3uploads[i];
      thumbnailRecord.push({
        width,
        height,
        url: src,
      });
      deleteFile(path);
    }
    return thumbnailRecord;
  }

  /**
   * This function delete videos upload success but not use in any service
   */
  async deleteVideosNotUse(maxAgeInHour?: number) {
    try {
      let offset = 0;
      while (true) {
        const videos = await this.videoRepository.getVideosNotUse({
          offset,
          limit: DELETE_VIDEO_NOT_USE_BULK_SIZE_IN_NUMBER,
          maxAgeInHour,
        });
        const ids = videos.map((video) => video.id);
        await this.deleteByIds(ids);

        if (videos.length < DELETE_VIDEO_NOT_USE_BULK_SIZE_IN_NUMBER) {
          break;
        }
        offset += DELETE_VIDEO_NOT_USE_BULK_SIZE_IN_NUMBER;
      }
    } catch (error) {
      if (error.customCode !== EXCEPTIONS.VIDEO.NOT_FOUND.customCode) {
        this.logger.log({ message: 'delete videos not use failed', error });
      }
    }
  }

  async processVideo(bucket: string, key: string) {
    const videoId = VideoHelper.getVideoIdFromPath(key);
    if (!videoId) {
      throw new Exception(EXCEPTIONS.VIDEO.NOT_FOUND).withFields({
        detailedError: `not found videoId`,
      });
    }
    const videoFullPath = path.join(getUploadTempPath(), videoId);

    try {
      const video = await this.videoRepository.getById(videoId);
      const videoPath = new VideoPath(videoId, video.properties);

      if (!video || video.status != UPLOAD_VIDEO_STATUS.INIT) {
        this.logger.debug('Ignore video process', videoId);
        return;
      }

      await this.storagePort.downloadVideoFromS3(
        key,
        `${getUploadTempPath()}/${videoId}`,
      );

      const metadata = await MetadataHelper.getMetadataVideo(videoFullPath);
      const thumbnailRecord = await this.generateThumbnailsAndUploadToS3(
        videoId,
        videoFullPath,
        VideoUploadType.postVideo,
        metadata,
      );

      const presignedUrlVideo = await this.storagePort.getPresignedUrl(
        videoPath.getOriginPath(),
        this.s3Config.userUploadVideosBucket,
        {
          ExpiresInSecond: VIDEO_PRESIGNED_POST_EXPIRED,
        },
      );

      const record: UpdateVideoDto = {
        originUrl: presignedUrlVideo.split('?')[0],
        status: UPLOAD_VIDEO_STATUS.UPLOADED,
        thumbnails: thumbnailRecord,
        properties: {
          ...video.properties,
          width: metadata.getWidthAfterRotate(),
          height: metadata.getHeightAfterRotate(),
          videoCodec: metadata.getCodecName(),
          duration: metadata.getDuration(),
          fps: metadata.getFPS(),
        },
        isUse: false,
      };
      await this.videoRepository.updateById(videoId, record);
      deleteFile(videoFullPath);

      const result = { id: videoId, ...record };
      delete result.originUrl;
      this.logger.log({
        message: 'upload video success',
        videoId: videoId,
        properties: record.properties,
        resource: VideoUploadType.postVideo,
        userId: video.userId,
      });
      return result;
    } catch (error) {
      deleteFile(videoFullPath);
      this.logger.log({
        message: 'upload video failed',
        videoId: videoId,
        error,
      });
      throw error;
    }
  }
}
