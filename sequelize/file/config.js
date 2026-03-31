// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

module.exports = {
  username: process.env.POSTGRES_FILE_USER,
  password: process.env.POSTGRES_FILE_PASSWORD,
  database: process.env.POSTGRES_FILE_DB,
  host: process.env.POSTGRES_FILE_HOST,
  port: process.env.POSTGRES_FILE_PORT,
  dialect: process.env.POSTGRES_FILE_CONNECTION,
  define: {
    schema: process.env.POSTGRES_FILE_SCHEMA,
  },
  native: true,
};
