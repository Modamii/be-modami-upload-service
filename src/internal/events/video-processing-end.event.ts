import { UPLOAD_VIDEO_STATUS } from '../domain/video.constant';
import { ThumbnailDto, VideoPropertiesDto } from '../domain/video.domain';

export class VideoProcessingEndEvent {
  videoId: string;
  postId?: string;
  status: UPLOAD_VIDEO_STATUS;
  hlsUrl?: string;
  thumbnails?: ThumbnailDto[];
  properties?: VideoPropertiesDto;
}
