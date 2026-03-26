import { Config } from './config.interface';
import { SASLMechanismOptionsMap } from 'kafkajs';

export default (): Config => ({
  nest: {
    port: parseInt(process.env.PORT),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    video: {
      connection: process.env.POSTGRES_VIDEO_CONNECTION,
      host: process.env.POSTGRES_VIDEO_HOST,
      port: parseInt(process.env.POSTGRES_VIDEO_PORT),
      database: process.env.POSTGRES_VIDEO_DB,
      username: process.env.POSTGRES_VIDEO_USER,
      password: process.env.POSTGRES_VIDEO_PASSWORD,
      schema: process.env.POSTGRES_VIDEO_SCHEMA,
    },
    image: {
      connection: process.env.POSTGRES_IMAGE_CONNECTION,
      host: process.env.POSTGRES_IMAGE_HOST,
      port: parseInt(process.env.POSTGRES_IMAGE_PORT),
      database: process.env.POSTGRES_IMAGE_DB,
      username: process.env.POSTGRES_IMAGE_USER,
      password: process.env.POSTGRES_IMAGE_PASSWORD,
      schema: process.env.POSTGRES_IMAGE_SCHEMA,
    },
    file: {
      connection: process.env.POSTGRES_FILE_CONNECTION,
      host: process.env.POSTGRES_FILE_HOST,
      port: parseInt(process.env.POSTGRES_FILE_PORT),
      database: process.env.POSTGRES_FILE_DB,
      username: process.env.POSTGRES_FILE_USER,
      password: process.env.POSTGRES_FILE_PASSWORD,
      schema: process.env.POSTGRES_FILE_SCHEMA,
    },
    pool: {
      max: Number(process.env.POSTGRES_POOL_MIN) || 1,
      min: Number(process.env.POSTGRES_POOL_MAX) || 1,
      idle: Number(process.env.POSTGRES_POOL_IDLE) || 1,
    },
  },
  s3: {
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    userUploadVideosBucket: process.env.AWS_S3_USER_UPLOAD_VIDEOS_BUCKET,
    userUploadImagesBucket: process.env.AWS_S3_USER_UPLOAD_IMAGES_BUCKET,
    userUploadFilesBucket: process.env.AWS_S3_USER_UPLOAD_FILES_BUCKET,
    eKycBucket: process.env.AWS_S3_EKYC_BUCKET,
  },
  kafka: {
    clientID: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS ?? ''],
    consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID,
    mechanism:
      (process.env.KAFKA_SASL_MECHANISMS as keyof SASLMechanismOptionsMap) ??
      'plain',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
    env: process.env.KAFKA_ENV,
    ssl: {
      cert: process.env.KAFKA_SSL_CERT.split(`\\n`).join('\n'),
      key: process.env.KAFKA_SSL_KEY.split(`\\n`).join('\n'),
      ca: process.env.KAFKA_SSL_CA.split(`\\n`).join('\n'),
    },
  },
  vimeo: {
    clientID: process.env.VIMEO_CLIENT_ID,
    secret: process.env.VIMEO_CLIENT_SECRET,
    accessToken: process.env.VIMEO_ACCESS_TOKEN,
  },
  cognito: {
    region: process.env.AWS_COGNITO_REGION,
    poolId: process.env.AWS_COGNITO_POOL_ID,
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLE === 'true',
    title: 'Upload manage service',
    description: 'The upload manage API description',
    version: '1.0',
    path: 'api',
    apiBasePath: process.env.SWAGGER_API_BASE_PATH || '',
  },
  redis: {
    db: 0,
    clusterHosts: (process.env.REDIS_CACHE_CLUSTER_NODES || '')
      .split(',')
      .filter((v) => v),
    host: process.env.REDIS_CACHE_HOST || '',
    port: parseInt(process.env.REDIS_CACHE_PORT),
    username: process.env.REDIS_CACHE_USERNAME || 'default',
    password: process.env.REDIS_CACHE_PASSWORD,
    ssl: process.env.REDIS_CACHE_TLS === 'true',
    prefix:
      (process.env.REDIS_CACHE_PREFIX || 'local').replace(/:$/g, '') + ':',
  },
  redisSharedStore: {
    db: 0,
    clusterHosts: (process.env.REDIS_SHARED_STORE_CLUSTER_NODES || '')
      .split(',')
      .filter((v) => v),
    host: process.env.REDIS_SHARED_STORE_HOST || '',
    port: parseInt(process.env.REDIS_SHARED_STORE_PORT),
    username: process.env.REDIS_SHARED_STORE_USERNAME || 'default',
    password: process.env.REDIS_SHARED_STORE_PASSWORD,
    ssl: process.env.REDIS_SHARED_STORE_TLS === 'true',
    prefix:
      (process.env.REDIS_SHARED_STORE_PREFIX || 'develop').replace(/:$/g, '') +
      ':',
  },
  tempPath: process.env.TEMP_PATH || '/tmp/',
  hlsPrefixUrl:
    process.env.HLS_PREFIX_URL +
    (process.env.HLS_PREFIX_URL.slice(-1) != '/' ? '/' : ''),
  sqs: {
    resizeImageQueueUrl: process.env.AWS_S3_SQS_RESIZE_IMAGE_QUEUE_URL,
    videoQueueUrl: process.env.AWS_S3_SQS_VIDEO_QUEUE_URL,
  },
  imageProxyUrl: process.env.IMAGE_PROXY_URL,
});
