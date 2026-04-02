export const KAFKA_INJECT_TOKEN = 'KAFKA_INJECT_TOKEN';

export const EVENTS = {
  JOBS: {
    MARK_VIDEOS_HAS_BEEN_USED: 'bein_upload.job.mark_videos_has_been_used',
    DELETE_VIDEOS: 'bein_upload.job.delete_videos',
    MARK_FILES_HAS_BEEN_USED: 'bein_upload.job.mark_files_has_been_used',
    DELETE_FILES: 'bein_upload.job.delete_files',
  },
  BEIN_UPLOAD: {
    VIDEO_PROCESSING_DONE: 'bein_upload.video_processing_end',
  },
  BEIN_STREAM: {
    VIDEO_POST_HAS_BEEN_CREATED: 'bein_stream.video_post_has_been_created',
    RESYNC_VIDEO_POST_HAS_BEEN_CREATED:
      'bein_stream.resync_video_post_has_been_created',
  },
};
