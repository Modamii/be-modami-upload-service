import fs from 'fs';
import path from 'path';
import { deleteOldTempFiles } from '../path.helper';
import { deleteFile, getUploadTempPath } from '../../helpers';

jest.mock('../../helpers/file.helper.ts', () => {
  return { deleteFile: jest.fn() };
});

describe('Metadata', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUploadFileTooOld', () => {
    const err = new Error('err...');
    const maxAgeInMinute = 1;
    it('should delete', async () => {
      jest.spyOn(fs, 'readdir').mockImplementation((path, handle: any) => {
        handle(null, ['1000', '100', '10']);
      });
      jest.spyOn(fs, 'stat').mockImplementation((path, handle: any) => {
        const aMinuteAgo = new Date(
          Date.now() - maxAgeInMinute * 60 * 1000 - 100,
        ).toISOString();
        handle(null, {
          dev: 129,
          mode: 33188,
          nlink: 1,
          uid: 0,
          gid: 0,
          rdev: 0,
          blksize: 4096,
          ino: 6345494,
          size: 0,
          blocks: 0,
          atimeMs: 1653995416220.2522,
          mtimeMs: 1653995416220.2522,
          ctimeMs: 1653995416220.2522,
          birthtimeMs: 1653995416220.2522,
          atime: '2021-05-31T11:10:16.220Z',
          mtime: '2021-05-31T11:10:16.220Z',
          ctime: aMinuteAgo,
          birthtime: '2021-05-31T11:10:16.220Z',
        });
      });
      deleteOldTempFiles(maxAgeInMinute);
      expect(deleteFile).toBeCalledTimes(3);
      expect(deleteFile).toBeCalledWith(path.join(getUploadTempPath(), '1000'));
      expect(deleteFile).toBeCalledWith(path.join(getUploadTempPath(), '100'));
      expect(deleteFile).toBeCalledWith(path.join(getUploadTempPath(), '10'));
    });

    it('should not delete', async () => {
      jest.spyOn(fs, 'readdir').mockImplementation((path, handle: any) => {
        handle(null, ['1000', '100', '10']);
      });
      jest.spyOn(fs, 'stat').mockImplementation((path, handle: any) => {
        const aMinuteAgo = new Date(
          Date.now() - maxAgeInMinute * 60 * 1000 + 100,
        ).toISOString();
        handle(null, {
          dev: 129,
          mode: 33188,
          nlink: 1,
          uid: 0,
          gid: 0,
          rdev: 0,
          blksize: 4096,
          ino: 6345494,
          size: 0,
          blocks: 0,
          atimeMs: 1653995416220.2522,
          mtimeMs: 1653995416220.2522,
          ctimeMs: 1653995416220.2522,
          birthtimeMs: 1653995416220.2522,
          atime: '2050-05-31T11:10:16.220Z',
          mtime: '2050-05-31T11:10:16.220Z',
          ctime: aMinuteAgo,
          birthtime: '2050-05-31T11:10:16.220Z',
        });
      });
      deleteOldTempFiles(1);
      expect(deleteFile).toBeCalledTimes(0);
    });

    it('should return error', async () => {
      jest.spyOn(fs, 'readdir').mockImplementation((path, handle: any) => {
        handle(null, ['abcd']);
      });
      jest.spyOn(fs, 'stat').mockImplementation((path, handle: any) => {
        handle(err, {});
      });
      deleteOldTempFiles(1);
      expect(deleteFile).toBeCalledTimes(0);
    });
  });
});
