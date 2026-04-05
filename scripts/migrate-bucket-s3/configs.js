/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

module.exports = {
  dbUploadVideo: {
    host: process.env.POSTGRES_VIDEO_HOST,
    port: process.env.POSTGRES_VIDEO_PORT,
    user: process.env.POSTGRES_VIDEO_USER,
    password: process.env.POSTGRES_VIDEO_PASSWORD,
    database: process.env.POSTGRES_VIDEO_DB,
    scheme: process.env.POSTGRES_VIDEO_SCHEMA,
  },
  dbUploadFile: {
    host: process.env.POSTGRES_FILE_HOST,
    port: process.env.POSTGRES_FILE_PORT,
    user: process.env.POSTGRES_FILE_USER,
    password: process.env.POSTGRES_FILE_PASSWORD,
    database: process.env.POSTGRES_FILE_DB,
    scheme: process.env.POSTGRES_FILE_SCHEMA,
  },
};
