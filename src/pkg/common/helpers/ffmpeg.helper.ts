import { Logger } from '@nestjs/common';
import { FfmpegCommand } from 'fluent-ffmpeg';
export async function RunFfmpeg(
  ffmpeg: FfmpegCommand,
): Promise<{ executionTime: any; filenames: string[]; command: string }> {
  return new Promise((resolve, reject) => {
    let filenames = [];
    const timeStartFunc = new Date().getTime();
    let command = 'ffmpeg ' + ffmpeg._getArguments().join(' ');
    ffmpeg
      .addInputOptions('-hide_banner')
      .addInputOption('-y')
      .on('start', function (commandLine) {
        command = commandLine;
      })
      .on('progress', function (progress) {
        Logger.verbose(
          `Processing: ${progress.percent} % done; ${ffmpeg['_inputs'][0]?.source}`,
        );
      })
      .on('filenames', function (_filenames) {
        filenames = _filenames;
      })
      .on('end', function (stdout, stderr) {
        const executionTime = new Date().getTime() - timeStartFunc;
        Logger.debug({ message: 'ffmpeg run success', executionTime, command });
        return resolve({
          executionTime: executionTime,
          filenames: filenames,
          command: command,
        });
      })
      .on('error', function (err, stdout, stderr) {
        Logger.log({
          message: 'ffmpeg run failed',
          command,
          stdout,
          stderr,
          error: err,
        });
        return reject({ stdout, stderr, command });
      })
      .run();
  });
}
