import {
  ImageDto,
  ImagePropertiesDto,
  Resource,
  DeleteOpts,
  CreateImageDto,
  CreateImageResponseDto,
  IMAGE_STATUS,
} from '../domain/image.domain';
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { join } from 'path';
import fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { imageSize } from 'image-size';

import { IImageRepository } from '../port/image-repository.port';
import { IObjectStoragePort } from '../port/object-storage.port';
import {
  IMAGE_REPOSITORY,
  OBJECT_STORAGE_PORT,
} from '../port/injection-tokens';
import { deleteFile } from '../../pkg/common/helpers';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { Exception, EXCEPTIONS } from '../../pkg/common/exceptions';
import {
  DEFAULT_EXTENSION_RESIZE,
  DEFAULT_MIMETYPE,
  HQ_ANIMATION_MAX_HEIGHT,
  HQ_ANIMATION_MAX_WIDTH,
  IMAGE_PRESIGNED_URL_EXPIRED,
  IMAGE_MAX_ANIMATION_FRAMES,
  UnknownUserId,
  RESOURCE_SUPPORT_ANIMATION,
  MIMETYPE_ANIMATION,
} from '../domain/image.constant';
import {
  ImagePath,
  ImageHelper,
  getImageMetadata,
  exiftool,
} from '../domain/image.helper';
import { AwsS3Config } from '../../pkg/configs/config.interface';

@Injectable()
export class ImageService implements OnApplicationShutdown {
  private logger = new Logger(ImageService.name);
  private imageProxyUrl: string;
  private tempPath: string;
  private s3Config: AwsS3Config;
  constructor(
    @Inject(IMAGE_REPOSITORY)
    private readonly imageRepository: IImageRepository,
    @Inject(OBJECT_STORAGE_PORT)
    private readonly storagePort: IObjectStoragePort,
    private configService: ConfigService,
  ) {
    this.imageProxyUrl = this.configService.get<string>('imageProxyUrl');
    this.tempPath = this.configService.get<string>('tempPath');
    this.s3Config = this.configService.get<AwsS3Config>('s3');
  }

  onApplicationShutdown() {
    exiftool.end();
  }

  async create(
    userId: string,
    createImageDto: CreateImageDto,
  ): Promise<CreateImageResponseDto> {
    const image = await this.imageRepository.create(userId, createImageDto);
    const imagePath = new ImagePath(image.resource, image.id, false);
    const presignedUrl = await this.storagePort.getPresignedUrl(
      imagePath.getOriginPath(),
      this.s3Config.userUploadImagesBucket,
      {
        contentType: image.properties.mimeType,
        ExpiresInSecond: IMAGE_PRESIGNED_URL_EXPIRED,
      },
    );

    const presignedPost = await this.storagePort.createPresignedPost(
      imagePath.getOriginPath(),
      this.s3Config.userUploadImagesBucket,
      {
        contentType: image.properties.mimeType,
        ExpiresInSecond: IMAGE_PRESIGNED_URL_EXPIRED,
        limitSize: parseInt(process.env.MAX_IMAGE_SIZE_IN_MB),
      },
    );

    await this.bindUrlAndSrcAndErrorMessage(image);
    return { presignedUrl, presignedPost, ...image };
  }

  /**
   * @deprecated
   */
  async createMigrate(imageId: string, path: string) {
    return this.imageRepository.createMigrate(imageId, path);
  }

  async gets() {
    const images = await this.imageRepository.filter();
    for (const image of images) {
      this.bindUrlAndSrcAndErrorMessage(image);
    }
    return images;
  }

  async getById(id: string) {
    const image = await this.imageRepository.getById(id);
    await this.bindUrlAndSrcAndErrorMessage(image);
    return image;
  }

  async upload(
    userId: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<ImageDto> {
    const image = await this.imageRepository.getById(id);
    if (!image) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND);
    }

    const imagePath = new ImagePath(image.resource, image.id, false);
    const key = imagePath.getOriginPath();

    await this.storagePort.uploadImageToS3(file.path, key);
    await this.processImage(this.s3Config.userUploadImagesBucket, key);

    return this.imageRepository.getById(id);
  }

  async getByIds(ids: string[], userId?: string) {
    const images = await this.imageRepository.getByIds({ userId, ids });
    for (const image of images) {
      await this.bindUrlAndSrcAndErrorMessage(image);
    }
    return images;
  }

  private async getUrl(image: ImageDto): Promise<string> {
    if (image.resource == Resource.eKyc) {
      const imagePath = new ImagePath(image.resource, image.id, false);
      let path = image.path;
      if (!path) {
        path = imagePath.getOriginPath();
      }
      const url = await this.storagePort.getDownloadImagePresignedUrl(path);
      return url;
    }

    const imageCdnUrl = process.env.IMAGE_CDN_URL.replace(/\/+$/, '');
    return `${imageCdnUrl}${this.getSrc(image)}`;
  }

  private getSrc(image: ImageDto): string {
    if (image.status != IMAGE_STATUS.DONE) {
      return '';
    }
    const imagePath = new ImagePath(
      image.resource,
      image.id,
      image.properties?.isAnimation,
    );
    return `/${imagePath.getDefaultVariantsPath()}`;
  }

  async getAndWaitFinish(id: string) {
    const DelayTimeInMilliseconds = 300;
    const TimeoutInMilliseconds = 30000;
    for (let i = 0; i < TimeoutInMilliseconds / DelayTimeInMilliseconds; i++) {
      const image = await this.imageRepository.getById(id);
      if (
        image.status == IMAGE_STATUS.DONE ||
        image.status == IMAGE_STATUS.ERROR
      ) {
        await this.bindUrlAndSrcAndErrorMessage(image);
        return image;
      }
      await sleep(DelayTimeInMilliseconds);
    }
    throw new Exception(EXCEPTIONS.IMAGE.PROCESS_IMAGE_ERROR);
  }

  async updateById(
    id: string,
    data: {
      path?: string;
      properties?: ImagePropertiesDto;
      isUse?: boolean;
      status?: string;
      userId?: string;
    },
  ): Promise<number> {
    return this.imageRepository.updateById(id, data);
  }

  // processImage: update image info (path,...) and resize
  async processImage(bucket: string, path: string) {
    const imageId = ImageHelper.getImageIdFromPath(path);
    if (!imageId) {
      throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
        detailedError: `not found imageId`,
      });
    }

    try {
      const { image, isMigrate } = await this._getVisibleImage({
        imageId,
        path,
      });

      // If KYC ignore resize
      if (image.resource == Resource.eKyc) {
        const imagePath = new ImagePath(image.resource, image.id, false);
        const record = {
          status: IMAGE_STATUS.DONE,
          path: imagePath.getOriginPath(),
        };

        await this.imageRepository.updateById(imageId, record);
        return;
      }

      // Validate Animation
      let isAnimation = false;
      if (
        RESOURCE_SUPPORT_ANIMATION.includes(image.resource) &&
        (MIMETYPE_ANIMATION.includes(image.properties?.mimeType) || isMigrate)
      ) {
        const fileTempPath = join(this.tempPath, uuidV4());
        try {
          await this.storagePort.download(path, fileTempPath);
          const imageMetadata = await getImageMetadata(fileTempPath);
          isAnimation = imageMetadata.isAnimation();
          if (isAnimation) {
            imageMetadata.validateAnimation();
          }
        } catch (error) {
          throw error;
        } finally {
          deleteFile(fileTempPath);
        }
      }

      const imagePath = new ImagePath(image.resource, image.id, isAnimation);

      // Create hq image
      const resolution = ImageHelper.getHqResolution(image.resource);
      let maf = 1;
      let quality = 90;
      if (isAnimation) {
        resolution.width = HQ_ANIMATION_MAX_WIDTH;
        resolution.height = HQ_ANIMATION_MAX_HEIGHT;
        maf = IMAGE_MAX_ANIMATION_FRAMES;
        quality = 85;
      }

      const url = `${this.imageProxyUrl}/insecure/rs:fit:${resolution.width}:${resolution.height}/maf:${maf}/auto_rotate:1/q:${quality}/plain/s3://${bucket}/${path}@${DEFAULT_EXTENSION_RESIZE}`;
      const hqInfo = await this.getResizeImageAndSave(
        url,
        imagePath.getHighQualityPath(),
        path,
      );

      // Update record image
      const record = {
        path: imagePath.getHighQualityPath(),
        status: IMAGE_STATUS.DONE,
        properties: {
          ...image.properties,
          width: hqInfo.width,
          height: hqInfo.height,
        },
        errorCode: null,
      };
      if (isAnimation) {
        record.properties.isAnimation = true;
      }
      await this.imageRepository.updateById(imageId, record);

      // Delete origin
      this.storagePort.deleteImages([path]).catch();
    } catch (error) {
      this.logger.log({ message: 'resize image error', path, error });
      try {
        // May be duplicate consume message, ignore update image if process done before
        const image = await this.imageRepository.getById(imageId);
        if (image.status != IMAGE_STATUS.DONE) {
          const payload = {
            status: IMAGE_STATUS.ERROR,
            errorCode: EXCEPTIONS.IMAGE.UNPROCESSABLE.customCode,
          };
          if (error instanceof Exception && error.customCode.match(/^image/)) {
            payload.errorCode = error.customCode;
          }
          await this.imageRepository.updateById(imageId, payload);
        }
      } catch (error) {
        this.logger.log({ message: 'update image error', path, error: error });
      }
      throw error;
    }
  }

  private async _getVisibleImage(props: {
    imageId: string;
    path: string;
  }): Promise<{
    image: ImageDto;
    isMigrate: boolean;
  }> {
    const { imageId, path } = props;
    let isMigrate = false;
    let image: ImageDto;

    try {
      image = await this.imageRepository.getById(imageId);
      if (image.status == IMAGE_STATUS.DONE) {
        this.logger.log({ message: 'ignore resize', path });
        return;
      }
    } catch (error) {
      const resource = ImagePath.getResourceFromPath(path);
      if (!resource) {
        throw new Exception(EXCEPTIONS.IMAGE.NOT_FOUND).withFields({
          detailedError: `path=${path}`,
        });
      }
      image = await this.imageRepository.createWithImageId(
        UnknownUserId,
        imageId,
        {
          properties: { mimeType: DEFAULT_MIMETYPE },
          resource: resource as any,
        },
      );
      isMigrate = true;
    }
    return { image, isMigrate };
  }

  async getResizeImageAndSave(
    url: string,
    hqPath: string,
    originPath: string,
  ): Promise<{ width: number; height: number }> {
    const fileTempPath = join(this.tempPath, uuidV4());
    try {
      try {
        await this.storagePort.downloadExternalUrl(url, fileTempPath);
      } catch (error) {
        // Throw error if resize error
        // Try detect why resize error
        // Check after resize to reduce latency, resize tool has config limit
        const originImageTempPath = join(this.tempPath, uuidV4());
        try {
          await this.storagePort.download(originPath, originImageTempPath);
          const imageMetadata = await getImageMetadata(originImageTempPath);
          imageMetadata.validate();
        } catch (validateError) {
          throw validateError;
        } finally {
          deleteFile(originImageTempPath);
        }
        throw error;
      }
      await this.storagePort.upload(fileTempPath, hqPath, {
        ContentType: DEFAULT_MIMETYPE,
      });
      const dimensions = imageSize(fs.readFileSync(fileTempPath));
      deleteFile(fileTempPath);
      return { width: dimensions.width, height: dimensions.height };
    } catch (error) {
      deleteFile(fileTempPath);
      throw error;
    }
  }

  async updateAndCloneImageIfNeed(
    imageId: string,
    newImage: { userId?: string; resource: Resource },
  ) {
    const image = await this.imageRepository.getById(imageId);
    if (newImage.resource && image.resource != newImage.resource) {
      return this.copy(imageId, newImage);
    }
    return this.updateImageAndResource(imageId, newImage);
  }

  async updateImageAndResource(
    imageId: string,
    newImage: { userId?: string; resource?: Resource },
  ) {
    let hasChangeResource = false;
    const image = await this.imageRepository.getById(imageId);
    const updateImagePayload = {} as ImageDto;
    if (newImage.userId) updateImagePayload.userId = newImage.userId;
    if (newImage.resource) {
      const resource = newImage.resource;
      const imagePath = new ImagePath(
        resource,
        image.id,
        image.properties.isAnimation,
      );
      let destinationPath = imagePath.getHighQualityPath();
      if (image.status == IMAGE_STATUS.INIT) {
        destinationPath = imagePath.getOriginPath();
      }
      hasChangeResource = image.path != destinationPath;
      if (hasChangeResource) {
        if (image.status == IMAGE_STATUS.ERROR) {
          throw new Exception(EXCEPTIONS.IMAGE.UNPROCESSABLE);
        }
        this.logger.log({
          message: `change resource`,
          path: image.path,
          destinationPath,
        });
        await this.storagePort.copyObject(image.path, destinationPath);
        // Update image
        updateImagePayload.resource = resource;
        updateImagePayload.path = destinationPath;
      }
    }

    await this.imageRepository.updateById(imageId, updateImagePayload);
    const updatedImage = { ...image, ...updateImagePayload };
    await this.bindUrlAndSrcAndErrorMessage(updatedImage);
    if (hasChangeResource) {
      this.storagePort.deleteImages([image.path]).catch();
    }
    return updatedImage;
  }

  async copy(
    imageId: string,
    newImage: { userId?: string; resource: Resource },
  ) {
    const image = await this.imageRepository.getById(imageId);
    if (image.status == IMAGE_STATUS.ERROR) {
      throw new Exception(EXCEPTIONS.IMAGE.UNPROCESSABLE);
    }
    const cloneImage = await this.create(image.userId, {
      properties: image.properties,
      resource: image.resource as Resource,
    });

    let hasChangeResource = false;
    const updateImagePayload = {} as ImageDto;

    if (newImage.userId) updateImagePayload.userId = newImage.userId;

    const resource = newImage.resource;
    const imagePath = new ImagePath(
      resource,
      cloneImage.id, // Change image id here
      image.properties.isAnimation,
    );
    let destinationPath = imagePath.getHighQualityPath();
    if (image.status == IMAGE_STATUS.INIT) {
      destinationPath = imagePath.getOriginPath();
    }
    hasChangeResource = image.resource != resource;
    if (hasChangeResource) {
      this.logger.log({
        message: `change resource`,
        path: image.path,
        destinationPath,
      });
      await this.storagePort.copyObject(image.path, destinationPath);
      // Update image
      updateImagePayload.resource = resource;
      updateImagePayload.path = destinationPath;
    }

    const { id, ...otherFields } = image;
    Object.assign(cloneImage, otherFields);
    Object.assign(cloneImage, updateImagePayload);
    await this.imageRepository.updateById(cloneImage.id, cloneImage);
    await this.bindUrlAndSrcAndErrorMessage(cloneImage as ImageDto);
    return cloneImage;
  }

  async bindUrlAndSrcAndErrorMessage(image: ImageDto) {
    image.url = await this.getUrl(image);
    image.src = this.getSrc(image);
    image.errorMessage = this.getErrorMessage(image);
    await this.bindPresignedUrl(image);
  }

  async bindPresignedUrl(image: ImageDto) {
    if (image.status != IMAGE_STATUS.INIT || image.resource != Resource.eKyc) {
      return;
    }

    const imagePath = new ImagePath(image.resource, image.id, false);
    const presignedUrl = await this.storagePort.getPresignedUrl(
      imagePath.getOriginPath(),
      this.s3Config.userUploadImagesBucket,
      {
        contentType: image.properties.mimeType,
        ExpiresInSecond: IMAGE_PRESIGNED_URL_EXPIRED,
      },
    );
    image.presignedUrl = presignedUrl;
  }

  private getErrorMessage(image: ImageDto): string {
    if (image.status == IMAGE_STATUS.ERROR) {
      const err = Object.values(EXCEPTIONS.IMAGE).find(
        (value) => value.customCode == image.errorCode,
      );
      return err.message;
    }
    return '';
  }

  async deleteByIds(imageIds: string[], opts?: DeleteOpts) {
    this.logger.log({ message: 'delete images', imageIds });
    const images = await this.getByIds(imageIds);
    await this.imageRepository.deleteByIds(imageIds);

    // Delete files in S3
    if (!opts?.ignoreDeleteS3) {
      for (const image of images) {
        if (image.status == IMAGE_STATUS.INIT) {
          continue;
        }
        if (image.resource == Resource.eKyc) {
          await this.storagePort.deleteEKycs([image.path]);
        } else {
          await this.storagePort.deleteImages([image.path]);
          // variants will be deleted by the s3 lifecycle policy in the future
        }
      }
    }
  }
}
