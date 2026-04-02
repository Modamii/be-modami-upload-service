import { CommandFactory } from 'nest-commander';
import { Module } from '@nestjs/common';
import { MapImagesInS3ToDBCommand } from './test.commander';
import { ConfigModule } from '@nestjs/config';
import config from '../pkg/configs/config';
import { DatabaseModule } from '../pkg/database/database.module';
import { LoggerProvider } from '../pkg/logger/logger.provider';
import { SetupImageBucketCommand } from './setup-image-bucket.commander';
import { InternalModule } from '../internal/adapter/handler/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      cache: true,
      expandVariables: true,
    }),
    DatabaseModule,
    InternalModule,
  ],
  providers: [SetupImageBucketCommand, MapImagesInS3ToDBCommand],
})
export class CommandModule {}

async function bootstrap() {
  await CommandFactory.runWithoutClosing(CommandModule, {
    logger: LoggerProvider.init(),
  });
}

bootstrap();
