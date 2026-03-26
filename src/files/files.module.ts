import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { Module } from '@nestjs/common';
import { FileDatabaseModule } from '../database/database.module';
import { FilesRepository } from './files.repository';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

@Module({
  imports: [FileDatabaseModule, ObjectStorageModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService],
})
export class FilesModule {}
