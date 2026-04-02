import { Logger } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { deleteFile } from './file.helper';

/**
 * create folder
 * @param fullPath example /usr/src/app/dist/upload/temp/test/devito360p.mp4
 * create folder /usr/src/app/dist/upload/temp/test/
 */
export function createPath(fullPath: string) {
  const dirPath = path.dirname(fullPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getUploadTempPath() {
  return path.join(process.env.TEMP_PATH || '/tmp', 'uploads');
}

export function deleteOldTempFiles(maxAgeInMinute: number) {
  try {
    const uploadTempPath = getUploadTempPath();
    fs.readdir(uploadTempPath, (err, files) => {
      files.forEach((file) => {
        fs.stat(path.join(uploadTempPath, file), (err, stat) => {
          if (err) {
            return Logger.warn(err);
          }
          const now = new Date().getTime();
          const endTime =
            new Date(stat.ctime).getTime() + maxAgeInMinute * 60 * 1000;
          if (now > endTime) {
            return deleteFile(path.join(uploadTempPath, file));
          }
        });
      });
    });
  } catch (error) {
    Logger.warn({ message: 'delete old temp file failed', error });
  }
}
