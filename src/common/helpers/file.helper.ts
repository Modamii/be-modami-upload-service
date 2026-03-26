import fs from 'fs';
import { Logger } from '@nestjs/common';

export function deleteFile(path: string) {
  fs.rm(path, (err) => {
    if (err) {
      Logger.warn({ message: `delete flie error`, path, error: err });
      return;
    }
    Logger.debug({ message: `delete file success`, path });
  });
}
