import { FileModel, VideoModel, ImageModel } from './models';
import { Module } from '@nestjs/common';
import { Dialect } from 'sequelize/types';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseConfig } from '../configs/config.interface';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<DatabaseConfig>('database');
        const { connection, host, port, database, username, password, schema } =
          databaseConfig.video;
        return {
          models: [VideoModel],
          operatorsAliases: null,
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          dialect: connection as Dialect,
          native: true,
          define: {
            schema: schema,
            paranoid: true,
            timestamps: true,
            underscored: true,
          },
          pool: databaseConfig.pool,
          logging: false,
          retry: {
            max: 300,
            match: [
              /ConnectionAcquireTimeoutError/,
              /SequelizeConnectionTimedOutError/,
              /SequelizeConnectionAcquireTimeoutError/,
            ],
            backoffBase: 1000,
            backoffExponent: 1.01, // default value is 1.1
            report(message, obj, err) {
              if (err) {
                console.error({
                  obj,
                  err,
                  message,
                  context: 'db',
                });
              }
            },
          },
        };
      },
    }),
    SequelizeModule.forFeature([VideoModel]),
  ],
  exports: [SequelizeModule],
})
export class VideoDatabaseModule {}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<DatabaseConfig>('database');
        const { connection, host, port, database, username, password, schema } =
          databaseConfig.file;
        return {
          models: [FileModel],
          operatorsAliases: null,
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          dialect: connection as Dialect,
          native: true,
          define: {
            schema: schema,
            paranoid: true,
            timestamps: true,
            underscored: true,
          },
          pool: databaseConfig.pool,
          logging: false,
        };
      },
    }),
    SequelizeModule.forFeature([FileModel]),
  ],
  exports: [SequelizeModule],
})
export class FileDatabaseModule {}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<DatabaseConfig>('database');
        const { connection, host, port, database, username, password, schema } =
          databaseConfig.image;
        return {
          models: [ImageModel],
          operatorsAliases: null,
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          dialect: connection as Dialect,
          native: true,
          define: {
            schema: schema,
            paranoid: true,
            timestamps: true,
            underscored: true,
          },
          pool: databaseConfig.pool,
          logging: false,
        };
      },
    }),
    SequelizeModule.forFeature([ImageModel]),
  ],
  exports: [SequelizeModule],
})
export class ImageDatabaseModule {}
