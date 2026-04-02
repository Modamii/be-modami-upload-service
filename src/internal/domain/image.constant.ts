import { Resource } from './image.domain';
import { ImageHelper } from './image.helper';

export const CURRENT_UPLOAD_IMAGE_VERSION = '1';

export const IMAGE_PRESIGNED_URL_EXPIRED = 300;

export const DEFAULT_EXTENSION_RESIZE = 'webp';
export const DEFAULT_MIMETYPE = 'image/webp';
export const HQ_MAX_WIDTH = 1920;
export const HQ_MAX_HEIGHT = HQ_MAX_WIDTH;
export const DEFAULT_MAX_WIDTH = 864;
export const DEFAULT_MAX_HEIGHT =
  ImageHelper.getResizeHeight(DEFAULT_MAX_WIDTH);
export const UnknownUserId = 'unknown';
export const IMAGE_ANIMATION_LIMIT_IN_MB =
  parseInt(process.env.IMAGE_ANIMATION_LIMIT_IN_MB) || 5;
export const MAX_IMAGE_SIZE_IN_MB =
  parseInt(process.env.MAX_IMAGE_SIZE_IN_MB) || 25;
export const IMAGE_ANIMATION_MAX_RESOLUTION_IN_MEGAPIXELS =
  parseFloat(process.env.IMAGE_ANIMATION_MAX_RESOLUTION_IN_MEGAPIXELS) || 2.3;
export const IMAGE_MAX_RESOLUTION_IN_MEGAPIXELS =
  parseFloat(process.env.IMAGE_MAX_RESOLUTION_IN_MEGAPIXELS) || 33.2;
export const HQ_ANIMATION_MAX_WIDTH = 600;
export const HQ_ANIMATION_MAX_HEIGHT = HQ_ANIMATION_MAX_WIDTH;
export const IMAGE_MAX_ANIMATION_FRAMES =
  parseInt(process.env.IMAGE_MAX_ANIMATION_FRAMES) || 100;
export const RESOURCE_SUPPORT_ANIMATION = [
  String(Resource.postContent),
  String(Resource.articleContent),
  String(Resource.commentContent),
  String(Resource.badge),
];
export const MIMETYPE_ANIMATION = ['image/gif', 'image/webp'];
