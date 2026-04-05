// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

module.exports = {
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  dialect: process.env.POSTGRES_CONNECTION || 'postgres',
  define: {
    schema: process.env.POSTGRES_SCHEMA || 'public',
  },
  native: true,
};
