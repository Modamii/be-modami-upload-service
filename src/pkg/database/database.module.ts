import { FileModel, ImageModel } from './models';
import { Module } from '@nestjs/common';
import { Dialect } from 'sequelize/types';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseConfig } from '../configs/config.interface';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DatabaseConfig>('database');
        return {
          models: [ImageModel, FileModel],
          operatorsAliases: null,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          dialect: db.connection as Dialect,
          native: true,
          define: {
            schema: db.schema,
            paranoid: true,
            timestamps: true,
            underscored: true,
          },
          pool: db.pool,
          logging: false,
          // Auto-create schema and tables on startup (safe: never drops data)
          hooks: {
            afterConnect: async (connection: any) => {
              const schema = db.schema || 'public';
              await connection.query(
                `CREATE SCHEMA IF NOT EXISTS "${schema}";`,
              );
            },
          },
          sync: { force: false, alter: false },
          retry: {
            max: 300,
            match: [
              /ConnectionAcquireTimeoutError/,
              /SequelizeConnectionTimedOutError/,
              /SequelizeConnectionAcquireTimeoutError/,
            ],
            backoffBase: 1000,
            backoffExponent: 1.01,
            report(message, obj, err) {
              if (err) {
                console.error({ obj, err, message, context: 'db' });
              }
            },
          },
        };
      },
    }),
    SequelizeModule.forFeature([ImageModel, FileModel]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
