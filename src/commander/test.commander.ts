import { IMAGE_STATUS } from './../images/dto/image.dto';
import { ImageHelper, ImagePath } from './../images/images.helper';
import { Command, CommandRunner, Option } from 'nest-commander';
import { ImagesService } from '../images/images.service';
import { ConfigService } from '@nestjs/config';
import { AwsS3Config } from '../configs/config.interface';
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

interface BasicCommandOptions {
  bucket?: string;
  prefix?: string;
}

@Command({
  name: 'map-images-in-s3-to-db',
  description: 'Map images in S3 to DB',
})
export class MapImagesInS3ToDBCommand extends CommandRunner {
  private logger = new Logger(MapImagesInS3ToDBCommand.name);
  private s3Client: S3Client;
  constructor(
    private configService: ConfigService,
    private imagesService: ImagesService,
  ) {
    super();
    const s3Config = this.configService.get<AwsS3Config>('s3');
    this.s3Client = new S3Client({});
  }

  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    if (!options.bucket) {
      options.bucket = process.env.AWS_S3_USER_UPLOAD_IMAGES_BUCKET;
    }
    if (!options.prefix) {
      options.prefix = '';
    }
    this.logger.log({
      message: `${MapImagesInS3ToDBCommand.name} ${'START'}`,
      options,
    });
    const payloads: ListObjectsV2CommandInput = {
      Bucket: options.bucket,
      Prefix: options.prefix,
      MaxKeys: 1000,
    };
    while (true) {
      const promiseUpdates = [];
      const res = await this.s3Client.send(new ListObjectsV2Command(payloads));
      for (const info of res.Contents) {
        const path = info.Key;
        this.logger.log({ message: `Found ${path}` });
        const resource = ImagePath.getResourceFromPath(path);
        if (!resource) {
          this.logger.warn(`Not found resource for ${path}`);
          continue;
        }
        this.logger.log({ message: `Resource ${resource}` });
        if (path.includes('origin')) {
          this.logger.log({ message: `Process ${path}` });
          const imageId = ImageHelper.getImageIdFromPath(path);
          if (!imageId) {
            this.logger.log({ message: `Not found image id ${path}` });
            continue;
          }
          const updatePromise = this.imagesService.createMigrate(imageId, path);
          promiseUpdates.push(updatePromise);
        }
      }
      await Promise.all(promiseUpdates);
      if (!res.IsTruncated) break;
      payloads.ContinuationToken = res.NextContinuationToken;
      this.logger.log('Get further list...');
    }
  }

  @Option({
    flags: '-bucket --bucket [string]',
    description: 'Bucket name',
  })
  parseBucket(val: string): string {
    return val;
  }

  @Option({
    flags: '-prefix --prefix [string]',
    description: 'Path: example post/content/',
  })
  parsePath(val: string): string {
    return val;
  }
}
