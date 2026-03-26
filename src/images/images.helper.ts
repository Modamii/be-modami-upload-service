import fs from 'fs';
import { ExifTool } from 'exiftool-vendored';
import animated from 'animated-gif-detector';
import { Resource } from './dto/image.dto';
import {
  HQ_MAX_WIDTH,
  HQ_MAX_HEIGHT,
  DEFAULT_MAX_WIDTH,
  DEFAULT_MAX_HEIGHT,
  IMAGE_ANIMATION_LIMIT_IN_MB,
  IMAGE_ANIMATION_MAX_RESOLUTION_IN_MEGAPIXELS,
  IMAGE_MAX_ANIMATION_FRAMES,
  MAX_IMAGE_SIZE_IN_MB,
  IMAGE_MAX_RESOLUTION_IN_MEGAPIXELS,
} from './images.constant';
import { EXCEPTIONS, Exception } from '../common/exceptions';

export const exiftool = new ExifTool({ taskTimeoutMillis: 3000, maxProcs: 2 });

export class ImagePath {
  constructor(
    private resource: string,
    private imageId: string,
    private isAnimation: boolean,
  ) {}

  getOriginPath() {
    return `${this.getPrefix()}/origin/${ImagePath.getResourcePath(
      this.resource,
    )}/${this.imageId}`;
  }

  getHighQualityPath() {
    return `${this.getPrefix()}/hq/${ImagePath.getResourcePath(
      this.resource,
    )}/${this.imageId}`;
  }

  getVariantsPath(sizeLabel: string, extension: string) {
    return `${this.getPrefix()}/variants/${ImagePath.getResourcePath(
      this.resource,
    )}/${this.imageId}_${sizeLabel}.${extension}`;
  }

  getDefaultVariantsPath() {
    return `${this.getPrefix()}/variants/${ImagePath.getResourcePath(
      this.resource,
    )}/${this.imageId}`;
  }

  private getPrefix() {
    if (this.isAnimation) {
      return 'image/animation';
    }
    return 'image';
  }

  static getResourcePath(resource: string): string {
    return resource.split(':').join('/');
  }

  static getResourceFromPath(path: string): string {
    for (const resource of Object.values(Resource)) {
      if (path.match(new RegExp(`${ImagePath.getResourcePath(resource)}`))) {
        return resource;
      }
    }
    return null;
  }
}

export class ImageHelper {
  static getResizeHeight(width: number): number {
    return Math.round((16 * width) / 9);
  }

  static getImageIdFromPath(path: string): string {
    const uuidRegexp =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
    const listIds = path.match(uuidRegexp);
    if (Array.isArray(listIds) && listIds.length > 0) {
      return listIds[0];
    }
    return '';
  }

  static getHqResolution(resource: string): { width: number; height: number } {
    if (resource.includes('avatar')) return { width: 1440, height: 1440 };
    if (resource.includes('cover')) return { width: 1600, height: 1600 };
    return { width: HQ_MAX_WIDTH, height: HQ_MAX_HEIGHT };
  }

  static getDefaultResolution(resource: string): {
    width: number;
    height: number;
  } {
    if (resource.includes('avatar'))
      return { width: 320, height: ImageHelper.getResizeHeight(320) };
    return { width: DEFAULT_MAX_WIDTH, height: DEFAULT_MAX_HEIGHT };
  }
}

export class ImageMetadata {
  constructor(
    private metadata: {
      frames: number;
      size: number;
      megapixels: number;
      path: string;
    },
  ) {}

  isAnimation(): boolean {
    if (this.metadata.frames > 1) {
      return true;
    }
    return false;
  }

  validateAnimation() {
    if (this.metadata.size > IMAGE_ANIMATION_LIMIT_IN_MB * 1024 * 1024) {
      throw new Exception(EXCEPTIONS.IMAGE.LIMIT_FILE_SIZE).withFields({
        detailedError: `path=${this.metadata.path}`,
      });
    }
    if (
      this.metadata.megapixels > IMAGE_ANIMATION_MAX_RESOLUTION_IN_MEGAPIXELS
    ) {
      throw new Exception(EXCEPTIONS.IMAGE.LIMIT_RESOLUTION).withFields({
        detailedError: `path=${this.metadata.path}`,
      });
    }
    if (this.metadata.frames > IMAGE_MAX_ANIMATION_FRAMES) {
      throw new Exception(EXCEPTIONS.IMAGE.LIMIT_ANIMATION_FRAMES).withFields({
        detailedError: `path=${this.metadata.path}`,
      });
    }
  }

  validate() {
    if (this.metadata.size > MAX_IMAGE_SIZE_IN_MB * 1024 * 1024) {
      throw new Exception(EXCEPTIONS.IMAGE.LIMIT_FILE_SIZE).withFields({
        detailedError: `path=${this.metadata.path}`,
      });
    }
    if (this.metadata.megapixels > IMAGE_MAX_RESOLUTION_IN_MEGAPIXELS) {
      throw new Exception(EXCEPTIONS.IMAGE.LIMIT_RESOLUTION).withFields({
        detailedError: `path=${this.metadata.path}`,
      });
    }
  }
}

export async function getImageMetadata(
  imagePath: string,
): Promise<ImageMetadata> {
  const imageInfo = await exiftool.read(imagePath);
  const stat = fs.statSync(imagePath);
  let frames = 1;

  if (imageInfo.FrameCount) {
    frames = imageInfo.FrameCount;
  } else if (imageInfo.MIMEType == 'image/webp') {
    frames = await getWebpFrames(imagePath);
  } else if (animated(fs.readFileSync(imagePath))) {
    // Only work for gif
    frames = IMAGE_MAX_ANIMATION_FRAMES - 1;
  }

  return new ImageMetadata({
    frames: frames,
    size: stat.size,
    megapixels: imageInfo.Megapixels,
    path: imagePath,
  });
}

export async function getWebpFrames(webpFilePath: string): Promise<number> {
  const contents = await fs.promises.readFile(webpFilePath, 'utf-8');
  const count = (contents.match(/ANMF/g) || []).length;
  if (count == 0) return 1;
  return count;
}
