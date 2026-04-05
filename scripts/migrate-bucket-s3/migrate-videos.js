/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const configs = require('./configs');
const {
  arrayJsonToJsonb,
  renameBucketFromS3Url,
  getMockVideos,
} = require('./helper');

const videoDBClient = new Client({
  ...configs.dbUploadVideo,
  ssl: {
    rejectUnauthorized: false,
  },
});

let newVideosBucket = 'default_bucket';

process.argv.forEach(function (val, index, array) {
  if (val.includes('-bucket=')) {
    newVideosBucket = val.replace('-bucket=', '');
  }
});

migrateBucketS3();

async function migrateBucketS3() {
  await connectDBs();
  // let videos = getMockVideos();
  let videos = await getVideos();
  videos = renameBucketForVideos(videos);
  await saveVideosToDB(videos);
  process.exit(0);
}

async function connectDBs() {
  await videoDBClient.connect();
}

async function getVideos() {
  const scheme = configs.dbUploadVideo.scheme;
  const table = 'video';
  const { rows: videos } = await videoDBClient.query(
    `select * from ${scheme}."${table}";`,
  );
  console.log(`Got ${videos.length} videos`);
  return videos;
}

function renameBucketForVideos(videos = []) {
  for (const video of videos) {
    if (
      video.hasOwnProperty('origin_url') &&
      typeof video.origin_url === 'string'
    ) {
      video.origin_url = renameBucketFromS3Url(
        video.origin_url,
        newVideosBucket,
      );
    }
    if (video.hasOwnProperty('files') && Array.isArray(video.files)) {
      for (const file of video.files) {
        file.src = renameBucketFromS3Url(file.src, newVideosBucket);
      }
    }
    if (video.hasOwnProperty('thumbnails') && Array.isArray(video.thumbnails)) {
      for (const thumbnail of video.thumbnails) {
        thumbnail.url = renameBucketFromS3Url(thumbnail.url, newVideosBucket);
      }
    }
  }
  return videos;
}

async function saveVideosToDB(videos = []) {
  console.log('### Migrate Videos');
  const scheme = configs.dbUploadVideo.scheme;
  const table = 'video';
  for (const video of videos) {
    const raw = `update ${scheme}.${table} set origin_url = '${
      video.origin_url
    }', files = ${arrayJsonToJsonb(
      video.files,
    )}, thumbnails = ${arrayJsonToJsonb(video.thumbnails)} where id = '${
      video.id
    }';`;
    const { rowCount } = await videoDBClient.query(raw);
    console.log(`=> find id=${video.id} found ${rowCount} records`);
  }
}
