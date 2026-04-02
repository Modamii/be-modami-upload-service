import { Resource } from '../internal/domain/image.domain';
import { ImagePath } from '../internal/domain/image.helper';
import { Command, CommandRunner, Option } from 'nest-commander';
import { ConfigService } from '@nestjs/config';
import { AwsS3Config } from '../pkg/configs/config.interface';
import {
  S3Client,
  PutBucketNotificationConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

interface CommandOptions {
  queueArn?: string;
}

@Command({
  name: 'setup-image-bucket',
  description: 'Setup Event notification and Lifecycle rule',
})
export class SetupImageBucketCommand extends CommandRunner {
  private logger = new Logger(SetupImageBucketCommand.name);
  private s3Client: S3Client;
  constructor(private configService: ConfigService) {
    super();
    const s3Config = this.configService.get<AwsS3Config>('s3');
    this.s3Client = new S3Client({});
  }

  async run(passedParam: string[], options?: CommandOptions): Promise<void> {
    if (!options.queueArn) {
      options.queueArn = '';
    }
    this.logger.log({
      message: `${SetupImageBucketCommand.name} ${'START'}`,
      options,
    });

    // Reference https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3api/put-bucket-notification-configuration.html
    const notificationConfigurationInput = {
      Bucket: process.env.AWS_S3_USER_UPLOAD_IMAGES_BUCKET,
      NotificationConfiguration: {
        QueueConfigurations: [],
      },
    };
    for (const resource of Object.values(Resource)) {
      const prefix = ImagePath.getResourcePath(resource) + '/image/origin';
      notificationConfigurationInput.NotificationConfiguration.QueueConfigurations.push(
        {
          Id: 'Event upload prefix: ' + prefix,
          Events: ['s3:ObjectCreated:*'],
          QueueArn: options.queueArn,
          Filter: {
            Key: {
              FilterRules: [{ Name: 'prefix', Value: prefix }],
            },
          },
        },
      );
    }
    await this.s3Client.send(
      new PutBucketNotificationConfigurationCommand(
        notificationConfigurationInput,
      ),
    );

    // Reference https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3api/put-bucket-lifecycle-configuration.html
    const lifecycleConfigurationInput = {
      Bucket: process.env.AWS_S3_USER_UPLOAD_IMAGES_BUCKET,
      LifecycleConfiguration: {
        Rules: [],
      },
    };
    for (const resource of Object.values(Resource)) {
      const prefix = ImagePath.getResourcePath(resource) + '/image/origin';
      lifecycleConfigurationInput.LifecycleConfiguration.Rules.push({
        ID: 'Expired origin image. Prefix: ' + prefix,
        Status: 'Enabled',
        Prefix: prefix,
        Expiration: {
          Days: 7,
        },
      });
    }
    await this.s3Client.send(
      new PutBucketLifecycleConfigurationCommand(lifecycleConfigurationInput),
    );
  }

  @Option({
    flags: '-q --queueArn [string]',
    description:
      'QueueArn: example arn:aws:sqs:ap-southeast-1:296763675441:toan-test-local',
  })
  parsePath(val: string): string {
    return val;
  }
}
