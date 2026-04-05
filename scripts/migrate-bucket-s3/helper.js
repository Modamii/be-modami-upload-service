function renameBucketFromS3Url(url = '', bucket = 'default_bucket') {
  return url.replace(/https:\/\/.*\.s3\./, `https://${bucket}.s3.`);
}

function arrayJsonToJsonb(arr = []) {
  if (arr == null) return null;
  const arrStringEle = [];
  for (let ele of arr) {
    arrStringEle.push(`'${JSON.stringify(ele)}'`);
  }
  return `ARRAY[${arrStringEle.join(',')}]::JSONB[]`;
}

function getMockVideos() {
  return [
    {
      id: 'a00f90a8-5255-4017-b2de-a70ddc829a69',
      status: 'DONE',
      user_id: 'e750c6d5-81b0-4d81-a545-541ecfbffa50',
      files: [
        {
          src: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/variants/a00f90a8-5255-4017-b2de-a70ddc829a69_360p.mp4',
          size: 2847575,
          quality: '360p',
        },
        {
          src: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/variants/a00f90a8-5255-4017-b2de-a70ddc829a69_240p.mp4',
          size: 1102566,
          quality: '240p',
        },
      ],
      origin_url:
        'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/original/a00f90a8-5255-4017-b2de-a70ddc829a69.webm',
      properties: {
        fps: 25,
        name: 'big-buck-bunny_trailer.webm',
        size: 2165175,
        width: 640,
        height: 360,
        duration: 32.48,
        mimeType: 'video/webm',
        videoCodec: 'vp8',
      },
      metadata: null,
      props: { vimeoId: '736775236' },
      version: '1',
      created_at: '2022-08-05T06:49:59.105Z',
      updated_at: '2022-08-05T07:16:48.078Z',
      deleted_at: '2022-08-11T04:00:00.048Z',
      thumbnails: [
        {
          url: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/thumbnails/a00f90a8-5255-4017-b2de-a70ddc829a69_427x240.jpg',
          width: 427,
          height: 240,
        },
        {
          url: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/thumbnails/a00f90a8-5255-4017-b2de-a70ddc829a69_640x360.jpg',
          width: 640,
          height: 360,
        },
        {
          url: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/thumbnails/a00f90a8-5255-4017-b2de-a70ddc829a69_853x480.jpg',
          width: 853,
          height: 480,
        },
        {
          url: 'https://default_bucket.s3.ap-southeast-1.amazonaws.com/post/thumbnails/a00f90a8-5255-4017-b2de-a70ddc829a69_1280x720.jpg',
          width: 1280,
          height: 720,
        },
      ],
      is_use: false,
    },
  ];
}

module.exports = {
  renameBucketFromS3Url,
  arrayJsonToJsonb,
  getMockVideos,
};
