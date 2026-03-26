import { SASLMechanismOptionsMap } from 'kafkajs';

export interface Config {
  nest: NestConfig;
  database: DatabaseConfig;
  s3: AwsS3Config;
  kafka: KafkaConfig;
  vimeo: vimeoConfig;
  cognito: ICognitoConfig;
  tempPath: string;
  hlsPrefixUrl: string;
  swagger: ISwaggerConfig;
  redis: IRedisConfig;
  redisSharedStore: IRedisConfig;
  sqs: ISQSConfig;
  imageProxyUrl: string;
}

export interface NestConfig {
  port: number;
  env: string;
}

export interface DatabaseConfig {
  video: {
    connection: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    schema: string;
  };
  image: {
    connection: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    schema: string;
  };
  file: {
    connection: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    schema: string;
  };
  pool: {
    max: number;
    min: number;
    idle: number;
  };
}

export interface AwsS3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  userUploadVideosBucket: string;
  userUploadImagesBucket: string;
  userUploadFilesBucket: string;
  eKycBucket: string;
}

export interface KafkaConfig {
  clientID: string;
  brokers: string[];
  mechanism: keyof SASLMechanismOptionsMap;
  username: string;
  password: string;
  consumerGroupId: string;
  env: string;
  ssl: {
    cert: string;
    key: string;
    ca: string;
  };
}

export interface vimeoConfig {
  clientID: string;
  secret: string;
  accessToken: string;
}

export interface ICognitoConfig {
  region: string;
  poolId: string;
}

export interface ISwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
  apiBasePath: string;
}

export interface IRedisConfig {
  db: number;
  host: string;
  clusterHosts: string[];
  port: number;
  username: string;
  password: string;
  ssl: boolean;
  prefix: string;
}

export interface ISQSConfig {
  resizeImageQueueUrl: string;
  videoQueueUrl: string;
}
