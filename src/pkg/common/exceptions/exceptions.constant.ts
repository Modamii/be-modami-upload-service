import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code';

export const EXCEPTIONS = {
  COMMON: {
    VALIDATION_ERROR: {
      customCode: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.validation_error',
    },
    BAD_REQUEST: {
      customCode: ErrorCode.BAD_REQUEST,
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error.api.bad_request',
    },
    UNAUTHORIZED: {
      customCode: ErrorCode.UNAUTHORIZED,
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'error.api.unauthorized',
    },
    FORBIDDEN: {
      customCode: ErrorCode.FORBIDDEN,
      statusCode: HttpStatus.FORBIDDEN,
      message: 'error.api.forbidden',
    },
    AUTH_TOKEN_EXPIRED: {
      customCode: ErrorCode.UNAUTHORIZED,
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'error.app.auth_token.expired',
    },
    INTERNAL_SERVER_ERROR: {
      customCode: ErrorCode.INTERNAL_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'error.api.server_internal_error',
    },
    SERVICE_UNAVAILABLE: {
      customCode: ErrorCode.SERVICE_UNAVAIL,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'error.api.service_unavailable',
    },
    NOT_FOUND_USER_IN_CACHE: {
      customCode: ErrorCode.INTERNAL_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'error.api.server_internal_error',
    },
  },

  FILE: {
    NOT_FOUND: {
      customCode: ErrorCode.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.api.file.not_found',
    },
    FILE_ID_HAS_BEEN_USED: {
      customCode: ErrorCode.CONFLICT,
      statusCode: HttpStatus.CONFLICT,
      message: 'error.api.file.create.file_id_has_been_used',
    },
  },

  IMAGE: {
    NOT_FOUND: {
      customCode: ErrorCode.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.api.image.not_found',
    },
    IMAGE_ID_HAS_BEEN_USED: {
      customCode: ErrorCode.CONFLICT,
      statusCode: HttpStatus.CONFLICT,
      message: 'error.api.image.create.image_id_has_been_used',
    },
    PROCESS_IMAGE_ERROR: {
      customCode: ErrorCode.REQUEST_TIMEOUT,
      statusCode: HttpStatus.REQUEST_TIMEOUT,
      message: 'error.image.process.error',
    },
    UNPROCESSABLE: {
      customCode: ErrorCode.UNPROCESSABLE,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.unprocessable',
    },
    NOT_SUPPORT: {
      customCode: ErrorCode.UNPROCESSABLE,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.not_support',
    },
    LIMIT_FILE_SIZE: {
      customCode: ErrorCode.UNPROCESSABLE,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.file_size.too_large',
    },
    LIMIT_RESOLUTION: {
      customCode: ErrorCode.UNPROCESSABLE,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.resolution.too_large',
    },
    LIMIT_ANIMATION_FRAMES: {
      customCode: ErrorCode.UNPROCESSABLE,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.image.animation_frames.too_large',
    },
  },

  BUCKET: {
    NOT_FOUND: {
      customCode: ErrorCode.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
      message: 'error.bucket.not_found',
    },
  },

  UPLOAD: {
    FILE_SIZE: {
      customCode: ErrorCode.PAYLOAD_TOO_LARGE,
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: 'error.upload.error.file_size',
    },
  },
};
