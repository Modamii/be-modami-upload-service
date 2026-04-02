import { VimeoService } from './vimeo.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [VimeoService],
  exports: [VimeoService],
})
export class VimeoModule {}
