import { Metadata, MetadataHelper } from '../metadata.helper';

const videoMetadata = {
  streams: [
    {
      index: 0,
      codec_name: 'h264',
      codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
      profile: 'High',
      codec_type: 'video',
      codec_time_base: '977449/58500000',
      codec_tag_string: 'avc1',
      codec_tag: '0x31637661',
      width: 1280,
      height: 720,
      coded_width: 1280,
      coded_height: 720,
      has_b_frames: 0,
      sample_aspect_ratio: '1:1',
      display_aspect_ratio: '16:9',
      pix_fmt: 'yuv420p',
      level: 31,
      color_range: 'tv',
      color_space: 'bt709',
      color_transfer: 'smpte170m',
      color_primaries: 'bt709',
      chroma_location: 'left',
      refs: 1,
      is_avc: 'true',
      nal_length_size: '4',
      r_frame_rate: '120/1',
      avg_frame_rate: '29250000/977449',
      time_base: '1/90000',
      start_pts: 0,
      start_time: '0.000000',
      duration_ts: 977449,
      duration: '10.860544',
      bit_rate: '9860246',
      bits_per_raw_sample: '8',
      nb_frames: '325',
      disposition: {
        default: 1,
        dub: 0,
        original: 0,
        comment: 0,
        lyrics: 0,
        karaoke: 0,
        forced: 0,
        hearing_impaired: 0,
        visual_impaired: 0,
        clean_effects: 0,
        attached_pic: 0,
        timed_thumbnails: 0,
      },
      tags: {
        rotate: '90',
        creation_time: '2020-04-20T03:52:21.000000Z',
        language: 'eng',
        handler_name: 'VideoHandle',
      },
      side_data_list: [
        {
          side_data_type: 'Display Matrix',
          displaymatrix:
            '\n00000000:            0       65536           0\n00000001:       -65536           0           0\n00000002:            0           0  1073741824\n',
          rotation: -90,
        },
      ],
    },
    {
      index: 1,
      codec_name: 'aac',
      codec_long_name: 'AAC (Advanced Audio Coding)',
      profile: 'LC',
      codec_type: 'audio',
      codec_time_base: '1/48000',
      codec_tag_string: 'mp4a',
      codec_tag: '0x6134706d',
      sample_fmt: 'fltp',
      sample_rate: '48000',
      channels: 2,
      channel_layout: 'stereo',
      bits_per_sample: 0,
      r_frame_rate: '0/0',
      avg_frame_rate: '0/0',
      time_base: '1/48000',
      start_pts: 0,
      start_time: '0.000000',
      duration_ts: 520192,
      duration: '10.837333',
      bit_rate: '256015',
      max_bit_rate: '256000',
      nb_frames: '508',
      disposition: {
        default: 1,
        dub: 0,
        original: 0,
        comment: 0,
        lyrics: 0,
        karaoke: 0,
        forced: 0,
        hearing_impaired: 0,
        visual_impaired: 0,
        clean_effects: 0,
        attached_pic: 0,
        timed_thumbnails: 0,
      },
      tags: {
        creation_time: '2020-04-20T03:52:21.000000Z',
        language: 'eng',
        handler_name: 'SoundHandle',
      },
    },
  ],
  format: {
    filename: '/home/gs65/Documents/video/e2e-test/a0001.mp4',
    nb_streams: 2,
    nb_programs: 0,
    format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
    format_long_name: 'QuickTime / MOV',
    start_time: '0.000000',
    duration: '10.861000',
    size: '13739575',
    bit_rate: '10120301',
    probe_score: 100,
    tags: {
      major_brand: 'mp42',
      minor_version: '0',
      compatible_brands: 'isommp42',
      creation_time: '2020-04-20T03:52:21.000000Z',
      'com.android.version': '10',
      'com.android.capture.fps': '30.000000',
    },
  },
};
const metadata = new Metadata(videoMetadata);

describe('Metadata', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetadata', () => {
    it('should ok', async () => {
      const res = metadata.getMetadata();
      expect(res).toEqual(videoMetadata);
    });
  });

  describe('getStreams', () => {
    it('should ok', async () => {
      const res = metadata.getStreams();
      expect(res).toEqual(videoMetadata.streams);
    });
  });

  describe('getFormat', () => {
    it('should ok', async () => {
      const res = metadata.getFormat();
      expect(res).toEqual(videoMetadata.format);
    });
  });

  describe('getArrayStreamVideo', () => {
    it('should ok', async () => {
      const res = metadata.getArrayStreamVideo();
      expect(res).toEqual([videoMetadata.streams[0]]);
    });
  });

  describe('getArrayStreamAudio', () => {
    it('should ok', async () => {
      const res = metadata.getArrayStreamAudio();
      expect(res).toEqual([videoMetadata.streams[1]]);
    });
  });

  describe('getBitrate', () => {
    it('should ok', async () => {
      const res = metadata.getBitrate();
      expect(res).toEqual(Number(videoMetadata.format.bit_rate));
    });
  });

  describe('getWidth', () => {
    it('should ok', async () => {
      const res = metadata.getWidth();
      expect(res).toEqual(Number(videoMetadata.streams[0].width));
    });
  });

  describe('getHeight', () => {
    it('should ok', async () => {
      const res = metadata.getHeight();
      expect(res).toEqual(Number(videoMetadata.streams[0].height));
    });
  });

  describe('getWidthAfterRotate', () => {
    it('should ok', async () => {
      const res = metadata.getWidthAfterRotate();
      expect(res).toEqual(Number(videoMetadata.streams[0].height));
    });
  });

  describe('getHeightAfterRotate', () => {
    it('should ok', async () => {
      const res = metadata.getHeightAfterRotate();
      expect(res).toEqual(Number(videoMetadata.streams[0].width));
    });
  });

  describe('getCodecName', () => {
    it('should ok', async () => {
      const res = metadata.getCodecName();
      expect(res).toEqual(videoMetadata.streams[0].codec_name);
    });
  });

  describe('getFPS', () => {
    it('should ok', async () => {
      const res = metadata.getFPS();
      expect(res).toEqual(eval(videoMetadata.streams[0].r_frame_rate));
    });
  });

  describe('getDuration', () => {
    it('should ok', async () => {
      const res = metadata.getDuration();
      expect(res).toEqual(Number(videoMetadata.format.duration));
    });
  });

  describe('getRotate', () => {
    it('should ok', async () => {
      const res = metadata.getRotate();
      expect(res).toEqual(Number(videoMetadata.streams[0].tags.rotate));
    });
  });

  describe('getAudioBitrate', () => {
    it('should ok', async () => {
      const res = metadata.getAudioBitrate();
      expect(res).toEqual(Number(videoMetadata.streams[1].bit_rate));
    });
  });

  describe('getAudioCodecName', () => {
    it('should ok', async () => {
      const res = metadata.getAudioCodecName();
      expect(res).toEqual(videoMetadata.streams[1].codec_name);
    });
  });

  describe('getProfile', () => {
    it('should ok', async () => {
      const res = metadata.getProfile();
      expect(res).toEqual(videoMetadata.streams[0].profile);
    });
  });

  describe('getWidthHeightAfterResize', () => {
    it('should ok', async () => {
      const res = metadata.getWidthHeightAfterResize({ height: 240 });
      expect(res).toEqual({ height: 240, width: 135 });
    });

    it('should ok', async () => {
      const res = metadata.getWidthHeightAfterResize({ width: 135 });
      expect(res).toEqual({ height: 240, width: 135 });
    });
  });

  describe('getSize', () => {
    it('should ok', async () => {
      const res = metadata.getSize();
      expect(res).toEqual(Number(videoMetadata.format.size));
    });
  });
});

describe('MetadataHelper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWidthHeightByRatio', () => {
    it('should ok', async () => {
      const res = MetadataHelper.getWidthHeightByRatio(1, 2, { width: 1 });
      expect(res).toEqual({ width: 1, height: 2 });
    });

    it('should ok', async () => {
      const res = MetadataHelper.getWidthHeightByRatio(1, 2, { height: 2 });
      expect(res).toEqual({ width: 1, height: 2 });
    });

    it('should ok', async () => {
      const res = MetadataHelper.getWidthHeightByRatio(1, 2, {
        width: 1,
        height: 2,
      });
      expect(res).toEqual({ width: 1, height: 2 });
    });
  });
});
