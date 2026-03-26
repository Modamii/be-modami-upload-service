import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vimeoConfig } from '../configs/config.interface';
import { Vimeo } from 'vimeo';

const INTERVAL_CHECK_TRANSCODE_STATUS_TIME = 30 * 1000; // 30s
const TRANSCODE_COMPLETE_TIMEOUT_IN_MILLISECOND = 15 * 60 * 1000;
const VIDEO_QUALITIES = [1080, 720, 360, 240];

@Injectable()
export class VimeoService {
  private logger: Logger;
  private objIntervalCheckStatus: { [key: string]: NodeJS.Timer } = {};
  private objTranscodeCompleteTime: { [key: string]: Date } = {};
  private client: Vimeo;
  private cbTranscodeDone: (videoId: string, vimeoId: string) => Promise<void>;
  private cbTranscodeError: (videoId: string, vimeoId: string) => Promise<void>;

  constructor(private readonly configService: ConfigService) {
    const vimeoConfig = this.configService.get<vimeoConfig>('vimeo');
    this.client = new Vimeo(
      vimeoConfig.clientID,
      vimeoConfig.secret,
      vimeoConfig.accessToken,
    );
    this.logger = new Logger(VimeoService.name);
  }

  setCallBack(
    cbDone: (videoId: string, vimeoId: string) => Promise<void>,
    cbError: (videoId: string, vimeoId: string) => Promise<void>,
  ) {
    this.cbTranscodeDone = cbDone;
    this.cbTranscodeError = cbError;
  }

  addIntervalCheckTranscodeStatus(
    videoId: string,
    vimeoId: string,
    msTime: number = INTERVAL_CHECK_TRANSCODE_STATUS_TIME,
  ) {
    // Delete old interval
    if (this.objIntervalCheckStatus[vimeoId]) {
      clearInterval(this.objIntervalCheckStatus[vimeoId]);
    }

    const handleTranscodeSuccess = async () => {
      if (!this.objTranscodeCompleteTime[vimeoId]) {
        this.objTranscodeCompleteTime[vimeoId] = new Date();
      }
      // Check transcode full quality
      if (
        !(await this.isTranscodeCompleteFullQuality(vimeoId)) &&
        !this.isTranscodeCompleteFullQualityTimeout(vimeoId)
      ) {
        return;
      }
      clearInterval(this.objIntervalCheckStatus[vimeoId]);
      delete this.objIntervalCheckStatus[vimeoId];
      if (this.cbTranscodeDone) {
        this.cbTranscodeDone(videoId, vimeoId).catch((error) => {
          this.logger.error({
            message: 'call cbTranscodeDone error',
            error,
            videoId,
          });
        });
      }
    };

    const handleTranscodeError = () => {
      clearInterval(this.objIntervalCheckStatus[vimeoId]);
      delete this.objIntervalCheckStatus[vimeoId];
      if (this.cbTranscodeError) {
        this.cbTranscodeError(videoId, vimeoId).catch((error) => {
          this.logger.error({
            message: 'call cbTranscodeError error',
            error,
            videoId,
          });
        });
      }
    };

    const handleTranscodeStatus = async () => {
      try {
        // get transcode status from vimeo
        const status = await this.getTranscodeStatus(vimeoId);
        if (status === 'complete') {
          await handleTranscodeSuccess();
        } else if (status === 'error') {
          handleTranscodeError();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          // IF not found video in Video => transcode failed
          handleTranscodeError();
          return;
        }
        this.logger.log({
          message: `handle transcode status failed`,
          videoId,
          error: err,
        });
      }
    };

    // Set new interval
    this.objIntervalCheckStatus[vimeoId] = setInterval(
      handleTranscodeStatus,
      msTime,
    );
  }

  async getTranscodeStatus(
    vimeoId: string,
  ): Promise<'complete' | 'in_progress' | 'error'> {
    return new Promise((resolve, reject) => {
      // Reference https://developer.vimeo.com/api/reference/response/video
      this.client.request(
        `https://api.vimeo.com/videos/${vimeoId}?fields=transcode.status,status`,
        (error, body, status_code) => {
          this.logger.debug({
            vimeoId,
            message: 'get transcode status from Vimeo',
            status_code,
            error,
            body,
          });
          if (error || status_code != 200) {
            return reject(
              new Error(`getTranscodeStatus error; status ${status_code}`),
            );
          }

          if (body.status && String(body.status).includes('error')) {
            return resolve('error');
          }
          return resolve(body.transcode.status);
        },
      );
    });
  }

  /**
   * rendition 240p|360p|source...
   * @param vimeoId
   * @returns mp4Urls { "quality": "uhd", "rendition": "1440p", "link": "..."}
   */
  async getMp4Infos(vimeoId: string): Promise<{
    videoId: string;
    width: number;
    height: number;
    mp4Infos: [
      {
        rendition: string;
        link: string;
        quality: string;
        size: number;
        height: number;
      },
    ];
  }> {
    return new Promise((resolve, reject) => {
      this.client.request(
        `https://api.vimeo.com/videos/${vimeoId}?fields=download,name,width,height`,
        (error, body, status_code) => {
          if (body?.error) {
            this.logger.debug({
              vimeoId,
              message: 'get mp4 infos from Vimeo',
              status_code,
              error,
              body,
            });
          }

          if (error || status_code != 200) {
            return reject(new Error(`getMp4Urls error; status ${status_code}`));
          }
          return resolve({
            videoId: body.name,
            width: body.width,
            height: body.height,
            mp4Infos: body.download,
          });
        },
      );
    });
  }

  /**
   *
   * @param uri example videos/12345
   * @returns
   */
  private parserVideoURI(uri: string): { id: string } {
    const parts = uri.split('videos/');
    const vimeoId = parts[1];
    if (parts.length > 1) {
      return { id: vimeoId };
    }
    return { id: null };
  }

  /**
   *
   * @param name videoId
   * @param filePath
   * @returns
   */
  async upload(name: string, filePath: string): Promise<{ id: string }> {
    return new Promise((resolve, reject) => {
      this.client.upload(
        filePath,
        {
          name,
          privacy: { view: 'nobody' },
        },
        (uri) => {
          const { id } = this.parserVideoURI(uri);
          if (!id) {
            return reject(new Error('parserVideoURL failed url=' + uri));
          }
          this.logger.log({
            message: 'upload to Vimeo success',
            videoId: name,
            vimeoId: id,
          });
          return resolve({ id });
        },
        (bytes_uploaded, bytes_total) => {
          const percentage = ((bytes_uploaded / bytes_total) * 100).toFixed(2);
          this.logger.verbose({
            message: `upload video to Vimeo ${bytes_uploaded} bytes, ${percentage} %`,
            videoId: name,
          });
        },
        (error) => {
          this.logger.log({
            message: 'upload to Vimeo failed',
            videoId: name,
            error,
          });
          return reject(error);
        },
      );
    });
  }

  async delete(vimeoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.request(
        {
          method: 'DELETE',
          path: `/videos/${vimeoId}`,
        },
        (error, body, status_code) => {
          this.logger.debug({
            vimeoId,
            message: 'delete video from Vimeo',
            status_code,
            error,
            body,
          });
          if (error || (status_code != 204 && status_code != 200)) {
            return reject(
              new Error(`deleteUpload error; status ${status_code}`),
            );
          }
          return resolve();
        },
      );
    });
  }

  async isTranscodeCompleteFullQuality(vimeoId: string) {
    const videoInfo = await this.getMp4Infos(vimeoId);
    const highestTranscodeHeight = this.getHighestTranscodeHeight(
      videoInfo.height,
    );
    const highestTranscodeWidth = this.getHighestTranscodeWidth(
      videoInfo.width,
    );

    const highestTranscodeQuality =
      videoInfo.width > videoInfo.height
        ? highestTranscodeHeight
        : highestTranscodeWidth;
    // Check all quality available
    const qualitiesAvailable = videoInfo.mp4Infos.map(
      (mp4Info) => mp4Info.height,
    );
    qualitiesAvailable.push(
      // vertical video quality
      ...videoInfo.mp4Infos.map((mp4Info) =>
        Number(mp4Info.rendition.replace('p', '')),
      ),
    );

    if (qualitiesAvailable.length == 0) return false;
    for (const quality of VIDEO_QUALITIES) {
      if (
        quality <= highestTranscodeQuality &&
        !qualitiesAvailable.includes(quality)
      ) {
        return false;
      }
    }
    return true;
  }

  isTranscodeCompleteFullQualityTimeout(vimeoId: string) {
    if (!this.objTranscodeCompleteTime[vimeoId]) return false;
    return (
      new Date().getTime() - this.objTranscodeCompleteTime[vimeoId].getTime() >
      TRANSCODE_COMPLETE_TIMEOUT_IN_MILLISECOND
    );
  }

  getHighestTranscodeHeight(height: number): number {
    for (const quality of VIDEO_QUALITIES) {
      if (quality <= height) return quality;
    }
    return 0;
  }

  getHighestTranscodeWidth(width: number): number {
    for (const quality of VIDEO_QUALITIES) {
      if (quality <= width) return quality;
    }
    return 0;
  }
}
