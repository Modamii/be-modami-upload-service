import { HttpStatus } from '@nestjs/common';

export const EXCEPTIONS = {
  COMMON: {
    VALIDATION_ERROR: {
      customCode: 'api.validation_error',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.validation_error',
    },
    BAD_REQUEST: {
      customCode: 'api.bad_request',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.bad_request',
    },
    UNAUTHORIZED: {
      customCode: 'api.unauthorized',
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'error.api.unauthorized',
    },
    FORBIDDEN: {
      customCode: 'api.forbidden',
      statusCode: HttpStatus.FORBIDDEN,
      message: 'error.api.forbidden',
    },
    AUTH_TOKEN_EXPIRED: {
      customCode: 'app.auth_token.expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'error.app.auth_token.expired',
    },
    INTERNAL_SERVER_ERROR: {
      customCode: 'api.server_internal_error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'error.api.server_internal_error',
    },
    SERVICE_UNAVAILABLE: {
      customCode: 'api.service_unavailable',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'error.api.service_unavailable',
    },
    NOT_FOUND_USER_IN_CACHE: {
      customCode: 'api.server_internal_error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'error.api.server_internal_error',
    },
  },

  VIDEO: {
    NOT_FOUND: {
      customCode: 'api.video.not_found',
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.api.video.not_found',
    },
    PROCESS_VIDEO_ERROR: {
      customCode: 'video.process.error',
      statusCode: HttpStatus.REQUEST_TIMEOUT,
      message: 'error.video.process.error',
    },
    VIDEO_ID_HAS_BEEN_USED: {
      customCode: 'api.video.create.video_id_has_been_used',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.video.create.video_id_has_been_used',
    },
    NOT_FOUND_ORIGIN_URL: {
      customCode: 'api.video.processing.origin_not_found',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'error.api.video.processing.origin_not_found',
    },
    GEN_S3_FAILED: {
      customCode: 'api.video.gen_s3_failed',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.video.gen_s3_failed',
    },
  },

  FILE: {
    NOT_FOUND: {
      customCode: 'api.file.not_found',
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.api.file.not_found',
    },
    FILE_ID_HAS_BEEN_USED: {
      customCode: 'api.file.create.file_id_has_been_used',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.file.create.file_id_has_been_used',
    },
  },

  IMAGE: {
    NOT_FOUND: {
      customCode: 'api.image.not_found',
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.api.image.not_found',
    },
    IMAGE_ID_HAS_BEEN_USED: {
      customCode: 'api.image.create.image_id_has_been_used',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.image.create.image_id_has_been_used',
    },
    PROCESS_IMAGE_ERROR: {
      customCode: 'image.process.error',
      statusCode: HttpStatus.REQUEST_TIMEOUT,
      message: 'error.image.process.error',
    },
    UNPROCESSABLE: {
      customCode: 'image.unprocessable',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.unprocessable',
    },
    NOT_SUPPORT: {
      customCode: 'image.not_support',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.not_support',
    },
    LIMIT_FILE_SIZE: {
      customCode: 'image.file_size.too_large',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.file_size.too_large',
    },
    LIMIT_RESOLUTION: {
      customCode: 'image.resolution.too_large',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.resolution.too_large',
    },
    LIMIT_ANIMATION_FRAMES: {
      customCode: 'image.animation_frames.too_large',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.animation_frames.too_large',
    },
  },

  BUCKET: {
    NOT_FOUND: {
      customCode: 'bucket.not_found',
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.bucket.not_found',
    },
  },

  UPLOAD: {
    FILE_SIZE: {
      customCode: 'upload.error.file_size',
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: 'error.upload.error.file_size',
    },
  },
};
