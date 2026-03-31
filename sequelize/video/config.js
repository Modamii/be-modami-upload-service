// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

module.exports = {
  username: process.env.POSTGRES_VIDEO_USER,
  password: process.env.POSTGRES_VIDEO_PASSWORD,
  database: process.env.POSTGRES_VIDEO_DB,
  host: process.env.POSTGRES_VIDEO_HOST,
  port: process.env.POSTGRES_VIDEO_PORT,
  dialect: process.env.POSTGRES_VIDEO_CONNECTION,
  define: {
    schema: process.env.POSTGRES_VIDEO_SCHEMA,
  },
  native: true,
};
