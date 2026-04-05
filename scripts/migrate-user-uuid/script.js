/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const configs = require('./configs');
require('dotenv').config();

const groupDBClient = new Client({
  ...configs.dbGroup,
  ssl: {
    rejectUnauthorized: false,
  },
});

const fileDBClient = new Client({
  ...configs.dbUploadFile,
  ssl: {
    rejectUnauthorized: false,
  },
});

const videoDBClient = new Client({
  ...configs.dbUploadVideo,
  ssl: {
    rejectUnauthorized: false,
  },
});

migrateUserUuid();

async function migrateUserUuid() {
  await connectDBs();
  const users = await getUsers();
  const objIdToUuid = usersToObj(users);
  await migrateUserUuidInVideoDB(objIdToUuid);
  await migrateUserUuidInFileDB(objIdToUuid);
  process.exit(0);
}

async function connectDBs() {
  await groupDBClient.connect();
  await fileDBClient.connect();
  await videoDBClient.connect();
}

async function getUsers() {
  const { rows: users } = await groupDBClient.query(
    `select * from ${configs.dbGroup.scheme}."user";`,
  );
  console.log(`Got ${users.length} users`);
  return users;
}

function getUsersMock() {
  return [{ id: 'a01f26a6-7768-4214-b4b7-98adf42c71b1', old_id: 15 }];
}

function usersToObj(users = []) {
  const objIdToUuid = {};
  for (const user of users) {
    objIdToUuid[user.old_id] = user.id;
  }
  return objIdToUuid;
}

async function migrateUserUuidInFileDB(objIdToUuid = { 0: 'uuid' }) {
  console.log('### Migrate User Uuid In File DB');
  const scheme = configs.dbUploadFile.scheme;
  const table = 'file';
  for (const id of Object.keys(objIdToUuid)) {
    const uuid = objIdToUuid[id];
    console.log(`update user_id from ${id} to ${uuid}`);
    const { rowCount } = await fileDBClient.query(
      `update ${scheme}.${table} set user_id = '${uuid}' where user_id = '${id}';`,
    );
    console.log(`=> found ${rowCount} records`);
  }
}

async function migrateUserUuidInVideoDB(objIdToUuid = { 0: 'uuid' }) {
  console.log('### Migrate User Uuid In Video DB');
  const scheme = configs.dbUploadVideo.scheme;
  const table = 'video';
  for (const id of Object.keys(objIdToUuid)) {
    const uuid = objIdToUuid[id];
    console.log(`update user_id from ${id} to ${uuid}`);
    const { rowCount } = await videoDBClient.query(
      `update ${scheme}.${table} set user_id = '${uuid}' where user_id = '${id}';`,
    );
    console.log(`=> found ${rowCount} records`);
  }
}
