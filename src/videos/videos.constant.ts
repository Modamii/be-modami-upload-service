export enum UPLOAD_VIDEO_STATUS {
  INIT = 'INIT',
  UPLOADED = 'UPLOADED',
  // PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

export const S3_ACL = 'public-read';
export const VIDEO_PRESIGNED_POST_EXPIRED = 300;
export const CURRENT_UPLOAD_VERSION = '1';
export const THUMBNAIL_RESOLUTIONS = [240, 360, 480, 720];
export const THUMBNAIL_POSITION_PERCENT = 0.1; // position generate thumbnail [0,1]
export const JPG_EXTENSION = 'jpg';
export const THUMBNAIL_OPTIMIZE_QUALITY = 80; // [0, 100]
export const THUMBNAIL_SMALL_DURATION_SEEK_TIME = 1; // if seek time is too small => set first frame is thumbnail
export const DELETE_VIDEO_NOT_USE_BULK_SIZE_IN_NUMBER = 500;
