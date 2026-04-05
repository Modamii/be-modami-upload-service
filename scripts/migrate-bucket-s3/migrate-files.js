/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const configs = require('./configs');
const { renameBucketFromS3Url } = require('./helper');

const fileDBClient = new Client({
  ...configs.dbUploadFile,
  ssl: {
    rejectUnauthorized: false,
  },
});

let newFileBucket = 'default_bucket';

process.argv.forEach(function (val, index, array) {
  if (val.includes('-bucket=')) {
    newFileBucket = val.replace('-bucket=', '');
  }
});

migrateBucketS3();

async function migrateBucketS3() {
  await connectDBs();
  let files = await getFiles();
  files = renameBucketForFiles(files);
  await saveFilesToDB(files);
  process.exit(0);
}

async function connectDBs() {
  await fileDBClient.connect();
}

async function getFiles() {
  const scheme = configs.dbUploadFile.scheme;
  const table = 'file';
  const { rows: files } = await fileDBClient.query(
    `select * from ${scheme}."${table}";`,
  );
  console.log(`Got ${files.length} files`);
  return files;
}

function renameBucketForFiles(files = []) {
  for (const file of files) {
    if (
      file.hasOwnProperty('origin_url') &&
      typeof file.origin_url === 'string'
    ) {
      file.origin_url = renameBucketFromS3Url(file.origin_url, newFileBucket);
    }
  }
  return files;
}

async function saveFilesToDB(files = []) {
  console.log('### Migrate Files');
  const scheme = configs.dbUploadFile.scheme;
  const table = 'file';
  for (const file of files) {
    const { rowCount } = await fileDBClient.query(
      `update ${scheme}.${table} set origin_url = '${file.origin_url}' where id = '${file.id}';`,
    );
    console.log(`=> find id=${file.id} found ${rowCount} records`);
  }
}
