import { AppHelper } from '../helpers/app.helper';

export const ROUTES = {
  VIDEO: {
    CREATE: {
      PATH: 'videos',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_VIDEOS: {
      PATH: 'videos',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_DETAIL: {
      PATH: 'videos/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_BY_IDS: {
      PATH: 'videos/ids',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    UPLOAD: {
      PATH: 'videos/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_KATURA_REDIRECT_URL: {
      PATH: 'videos/:id/kaltura/:format',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    PROCESSING: {
      PATH: 'videos/:id/processing',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  IMAGE: {
    CREATE: {
      PATH: '',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_IMAGES: {
      PATH: '',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_DETAIL: {
      PATH: ':id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_BY_IDS: {
      PATH: 'ids',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  FILE: {
    CREATE: {
      PATH: 'files',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_FILES: {
      PATH: 'files',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_DETAIL: {
      PATH: 'files/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_BY_IDS: {
      PATH: 'files/ids',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    UPLOAD: {
      PATH: 'files/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  INTERNAL: {
    VIDEO: {
      GET_BY_IDS: {
        PATH: 'internal/videos/ids',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
    },
    FILE: {
      GET_BY_IDS: {
        PATH: 'internal/files/ids',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
    },
    IMAGE: {
      CREATE: {
        PATH: 'internal/images',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
      DELETE: {
        PATH: 'internal/images/:id',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
      UPDATE: {
        PATH: 'internal/images/:id',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
      COPY: {
        PATH: 'internal/images/:id/copy',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
      GET_BY_IDS: {
        PATH: 'internal/images/ids',
        VERSIONS: AppHelper.getVersionsSupported(),
      },
    },
  },
};
