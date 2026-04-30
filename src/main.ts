import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import {
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import process from 'node:process';

process.on('unhandledRejection', (error) => {
  console.error('UnhandledRejection', error);
});

import { AppModule } from './app.module';
import { KafkaGateway } from './pkg/kafka';
import { HttpExceptionFilter } from './pkg/common/filters';
import { LoggerProvider } from './pkg/logger/logger.provider';
import { HandleResponseInterceptor } from './pkg/common/interceptors';

import { ISwaggerConfig, NestConfig } from './pkg/configs/config.interface';
import { KafkaHealthBootstrap } from './pkg/health/kafka-health.bootstrap';
import { HEADER_VERSION_KEY } from './pkg/common/constants';

async function setupSwagger(app, configService: ConfigService) {
  const swaggerConfig = configService.get<ISwaggerConfig>('swagger');
  if (swaggerConfig.enabled) {
    const documentBuilder = new DocumentBuilder()
      .addSecurity('authorization', {
        type: 'apiKey',
        in: 'header',
        name: 'authorization',
      })
      .addApiKey({
        type: 'apiKey',
        in: 'header',
        name: 'x-version-id',
      })
      .addServer(swaggerConfig.apiBasePath)
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version);

    if (['development', 'local'].includes(process.env.NODE_ENV)) {
      documentBuilder.addGlobalParameters({
        in: 'header',
        name: 'user',
        description: 'This header use to cheat authentication',
        content: {
          username: {
            example: '{"custom:user_uuid": "test-local"}',
          },
        },
      });
    }
    const config = documentBuilder.build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}

async function setupKafka(app, configService: ConfigService) {
  KafkaGateway.init(app, configService)
    .then((app) => {
      KafkaHealthBootstrap.init(app);
    })
    .catch((ex) => Logger.error(ex));
}

async function setupGlobal(
  app: INestApplication,
  configService: ConfigService,
) {
  const nestConfig = configService.get<NestConfig>('nest');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new HandleResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter(nestConfig.env, '/'));
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
    ],
  });
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: HEADER_VERSION_KEY,
  });
  app.use(morgan('short'));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerProvider.init(),
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('v1/upload-services');
  await setupGlobal(app, configService);
  await setupSwagger(app, configService);

  await setupKafka(app, configService);

  const nestConfig = configService.get<NestConfig>('nest');
  await app.listen(nestConfig.port);
  Logger.log('Upload service listening :' + nestConfig.port);
}

bootstrap();
