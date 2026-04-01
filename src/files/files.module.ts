import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FilesRepository } from './files.repository';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

@Module({
  imports: [DatabaseModule, ObjectStorageModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService],
})
export class FilesModule {}
