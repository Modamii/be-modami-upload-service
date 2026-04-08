import { Config } from './config.interface';
import { SASLMechanismOptionsMap } from 'kafkajs';

export default (): Config => ({
  nest: {
    port: parseInt(process.env.PORT),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    connection: process.env.POSTGRES_CONNECTION || 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    schema: process.env.POSTGRES_SCHEMA,
    pool: {
      max: Number(process.env.POSTGRES_POOL_MAX) || 5,
      min: Number(process.env.POSTGRES_POOL_MIN) || 1,
      idle: Number(process.env.POSTGRES_POOL_IDLE) || 10000,
    },
  },
  s3: {
    endpoint: process.env.MINIO_ENDPOINT,
    region: process.env.MINIO_REGION || 'us-east-1',
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    userUploadVideosBucket: process.env.MINIO_VIDEOS_BUCKET,
    userUploadImagesBucket: process.env.MINIO_IMAGES_BUCKET,
    userUploadFilesBucket: process.env.MINIO_FILES_BUCKET,
    eKycBucket: process.env.MINIO_EKYC_BUCKET,
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
    ssl: process.env.KAFKA_SSL_CERT
      ? {
          cert: process.env.KAFKA_SSL_CERT.split(`\\n`).join('\n'),
          key: process.env.KAFKA_SSL_KEY.split(`\\n`).join('\n'),
          ca: process.env.KAFKA_SSL_CA.split(`\\n`).join('\n'),
        }
      : {
          cert: '',
          key: '',
          ca: '',
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
    title: 'Modami Upload Service API',
    description:
      'REST API for managing file, image, and video uploads.\n\n' +
      '**Storage backend:** MinIO (S3-compatible)\n\n' +
      '**Upload flow:**\n' +
      '1. Call `POST /images`, `POST /videos`, or `POST /files` to create a record and receive a presigned URL.\n' +
      '2. Upload the binary directly to MinIO using the presigned URL (no server proxy).\n' +
      '3. Poll `GET /:resource/:id?wait=true` to wait for async processing to finish.\n\n' +
      '**Authentication:** Pass a JWT in the `authorization` header.\n\n' +
      '**API versioning:** Set `x-version-id` header (e.g. `1.0`, `2.0`).',
    version: '1.0',
    path: 'swagger',
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
  tempPath: process.env.TEMP_PATH || '/tmp/',
  hlsPrefixUrl:
    process.env.HLS_PREFIX_URL +
    (process.env.HLS_PREFIX_URL.slice(-1) != '/' ? '/' : ''),
  sqs: {
    enabled: process.env.SQS_ENABLED === 'true',
    resizeImageQueueUrl: process.env.AWS_S3_SQS_RESIZE_IMAGE_QUEUE_URL,
    videoQueueUrl: process.env.AWS_S3_SQS_VIDEO_QUEUE_URL,
  },
  imageProxyUrl: process.env.IMAGE_PROXY_URL,
});
