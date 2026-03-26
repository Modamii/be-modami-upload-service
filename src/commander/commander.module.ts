import { ImagesModule } from './../images/images.module';
import { CommandFactory } from 'nest-commander';
import { Module } from '@nestjs/common';
import { MapImagesInS3ToDBCommand } from './test.commander';
import { ConfigModule } from '@nestjs/config';
import config from '../configs/config';
import { ImageDatabaseModule } from '../database/database.module';
import { LoggerProvider } from '../logger/logger.provider';
import { SetupImageBucketCommand } from './setup-image-bucket.commander';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      cache: true,
      expandVariables: true,
    }),
    ImageDatabaseModule,
    ImagesModule,
  ],
  providers: [SetupImageBucketCommand],
})
export class CommandModule {}

async function bootstrap() {
  await CommandFactory.runWithoutClosing(CommandModule, {
    logger: LoggerProvider.init(),
  });
}

bootstrap();
