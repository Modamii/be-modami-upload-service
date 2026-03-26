import ffprobeStatic from 'ffprobe-static';
process.env.FFPROBE_PATH = ffprobeStatic.path;
import ffprobe from 'ffprobe-client';

export class Metadata {
  constructor(metadata: object) {
    Object.assign(this, metadata);
  }
  getMetadata() {
    return this;
  }
  getStreams(): Array<any> {
    if (this.hasOwnProperty('streams')) {
      return this['streams'];
    }
    return [];
  }
  getFormat() {
    if (this.hasOwnProperty('format')) {
      return this['format'];
    }
    return null;
  }
  getArrayStreamVideo(): Array<any> {
    const ArrStreamVideo = [];
    if (this.getStreams()) {
      for (const stream of this.getStreams()) {
        if (stream.codec_type === 'video') {
          ArrStreamVideo.push(stream);
        }
      }
    }
    return ArrStreamVideo;
  }
  getArrayStreamAudio(): Array<any> {
    const arrStreamAudio = [];
    if (this.getStreams()) {
      for (const stream of this.getStreams()) {
        if (stream.codec_type === 'audio') {
          arrStreamAudio.push(stream);
        }
      }
    }
    return arrStreamAudio;
  }
  getBitrate(): number {
    const ArrStreamVideo = this.getArrayStreamVideo();
    if (
      this.getFormat() &&
      !Number.isNaN(this.getFormat().bit_rate) &&
      this.getFormat().bit_rate != 'N/A'
    ) {
      return Number(this.getFormat().bit_rate);
    }
    if (
      ArrStreamVideo.length > 0 &&
      Number.isInteger(ArrStreamVideo[0].bit_rate) &&
      isNumeric(ArrStreamVideo[0].width)
    ) {
      return Number(ArrStreamVideo[0].bit_rate);
    }
    return -1;
  }
  getWidth(): number {
    const ArrStreamVideo = this.getArrayStreamVideo();
    if (
      ArrStreamVideo.length > 0 &&
      ArrStreamVideo[0].width &&
      isNumeric(ArrStreamVideo[0].width)
    ) {
      return Number(ArrStreamVideo[0].width); //coded_width
    }
    return -1;
  }
  getHeight(): number {
    const ArrStreamVideo = this.getArrayStreamVideo();
    if (
      ArrStreamVideo.length > 0 &&
      ArrStreamVideo[0].height &&
      isNumeric(ArrStreamVideo[0].width)
    ) {
      return Number(ArrStreamVideo[0].height); //coded_width
    }
    return -1;
  }
  getWidthAfterRotate() {
    const width = this.getWidth();
    const height = this.getHeight();
    const rotate = this.getRotate();
    if ((rotate / 90) % 2 == 0) {
      return width;
    }
    return height;
  }
  getHeightAfterRotate() {
    const width = this.getWidth();
    const height = this.getHeight();
    const rotate = this.getRotate();
    if ((rotate / 90) % 2 == 0) {
      return height;
    }
    return width;
  }
  getCodecName(): string {
    const ArrStreamVideo = this.getArrayStreamVideo();
    if (ArrStreamVideo.length > 0 && ArrStreamVideo[0].codec_name) {
      return ArrStreamVideo[0].codec_name;
    }
    return null;
  }
  getFPS(): number {
    const ArrStreamVideo = this.getArrayStreamVideo();
    if (ArrStreamVideo.length > 0 && ArrStreamVideo[0].r_frame_rate) {
      try {
        return eval(ArrStreamVideo[0].r_frame_rate);
      } catch (err) {
        return -1;
      }
    }
    return -1;
  }
  getDuration(): number {
    if (this.getFormat() && isNumeric(this.getFormat().duration)) {
      return Number(this.getFormat().duration);
    }
    return -1;
  }
  getRotate(): number {
    for (const stream of this.getArrayStreamVideo()) {
      if (
        stream.hasOwnProperty('tags') &&
        stream.tags.hasOwnProperty('rotate') &&
        isNumeric(stream.tags.rotate)
      ) {
        return Number(stream.tags.rotate);
      }
    }
    return 0;
  }
  getAudioBitrate(): number {
    const ArrStreamAudio = this.getArrayStreamAudio();
    if (ArrStreamAudio.length > 0 && isNumeric(ArrStreamAudio[0].bit_rate)) {
      return Number(ArrStreamAudio[0].bit_rate);
    }
    return 128000;
  }
  getAudioCodecName(): string {
    const ArrStreamAudio = this.getArrayStreamAudio();
    if (ArrStreamAudio.length > 0 && ArrStreamAudio[0].codec_name) {
      return ArrStreamAudio[0].codec_name;
    }
    return null;
  }
  getProfile(): string {
    for (const stream of this.getArrayStreamVideo()) {
      if (stream.hasOwnProperty('profile')) {
        return stream.profile;
      }
    }
    return '';
  }
  /**
   * @Input nhập vào width or height dùng cho resize
   * @param width_height
   * @returns trả về width and height sau khi resize
   */
  getWidthHeightAfterResize(width_height: {
    width?: number;
    height?: number;
  }): { width: number; height: number } {
    if (width_height.width && width_height.height) {
      return { width: width_height.width, height: width_height.height };
    }
    if (width_height.width) {
      const height =
        (this.getHeightAfterRotate() * width_height.width) /
        this.getWidthAfterRotate();
      return { width: width_height.width, height: Math.round(height) };
    }
    if (width_height.height) {
      const width =
        (this.getWidthAfterRotate() * width_height.height) /
        this.getHeightAfterRotate();
      return { width: Math.round(width), height: width_height.height };
    }
    return {
      width: this.getWidthAfterRotate(),
      height: this.getHeightAfterRotate(),
    };
  }
  getSize(): number {
    if (this.getFormat() && isNumeric(this.getFormat().size)) {
      return Number(this.getFormat().size);
    }
    return -1;
  }
}

function isNumeric(num) {
  return !isNaN(num);
}

export class MetadataHelper {
  /**
   *
   * @param x ratio x
   * @param y ratio y
   * @param width_height
   * @example getWidthHeightByRatio(16, 9, {width: 320}) => {width: 320, height: 180}
   */
  static getWidthHeightByRatio(
    x: number,
    y: number,
    width_height: { width?: number; height?: number },
  ): { width: number; height: number } {
    if (width_height.width && width_height.height) {
      return { width: width_height.width, height: width_height.height };
    }
    if (width_height.width) {
      return {
        width: width_height.width,
        height: (width_height.width * y) / x,
      };
    }
    if (width_height.height) {
      return {
        width: (width_height.height * x) / y,
        height: width_height.height,
      };
    }
  }

  static async getMetadataVideo(fullPath) {
    const data = await ffprobe(fullPath);
    return new Metadata(data);
  }
}
