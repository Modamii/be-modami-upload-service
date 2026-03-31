// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

module.exports = {
  username: process.env.POSTGRES_IMAGE_USER,
  password: process.env.POSTGRES_IMAGE_PASSWORD,
  database: process.env.POSTGRES_IMAGE_DB,
  host: process.env.POSTGRES_IMAGE_HOST,
  port: process.env.POSTGRES_IMAGE_PORT,
  dialect: process.env.POSTGRES_IMAGE_CONNECTION,
  define: {
    schema: process.env.POSTGRES_IMAGE_SCHEMA,
  },
  native: true,
};
