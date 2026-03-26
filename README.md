## Description
This service manage transcode video.


## Installation

```bash
$ yarn install
```

Update env follow `.env.example`

Init db
```bash
create db, schema
docker network create --driver=bridge --subnet=10.10.33.0/24 --ip-range=10.10.33.0/24 --gateway=10.10.33.1 upload_network
docker compose up
docker exec -it upload_manage_service sh
yarn install
npx sequelize-cli db:migrate --config ./sequelize/file/config.js --migrations-path ./sequelize/file/migrations/ && npx sequelize-cli db:migrate --config ./sequelize/video/config.js --migrations-path ./sequelize/video/migrations/ && npx sequelize-cli db:migrate --config ./sequelize/image/config.js --migrations-path ./sequelize/image/migrations/
```

## Setup AWS SSO (SQS, S3,...)
Create `~/.aws/config`

```config
[default]
sso_start_url = https://beingroup.awsapps.com/start
sso_region = ap-southeast-1
sso_account_id = 296763675441
sso_role_name = modami-be-media-moderator
region = ap-southeast-1
```

```bash
aws sso login
```

## Running the app
```bash
docker network create --driver=bridge --subnet=10.10.33.0/24 --ip-range=10.10.33.0/24 --gateway=10.10.33.1 upload_network
docker compose up
```


```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Note
### Test start processing video
public event to `bein_stream.video_post_has_been_created`
```
{
    "postId": "test",
    "videoIds": ["b97ae919-d323-4962-ab84-b04f3bfe2caa"]
}
```

## Run script
Migrate rename bucket
```
node scripts/migrate-bucket-s3/migrate-files.js -bucket=bein-user-upload-files-develop
node scripts/migrate-bucket-s3/migrate-videos.js -bucket=bein-user-upload-videos-develop
```


## Run image proxy
```bash
docker run -p 8888:8080 -it -e IMGPROXY_DOWNLOAD_TIMEOUT=30 -e IMGPROXY_KEEP_ALIVE_TIMEOUT=30 -e IMGPROXY_READ_TIMEOUT=30 -e IMGPROXY_USE_S3=true -e AWS_SDK_LOAD_CONFIG=1 -u=0 --volume "/home/gs65/.aws:/root/.aws" --network=upload_network darthsim/imgproxy:v3.14.0
```
Resize example
```
http://localhost:3300/insecure/rs:fit:360:360/auto_rotate:1/q:85/plain/s3://modami-dev-user-upload-images-s3-bucket/1k-01.webp@jpg
```
## License

[""m licensed](LICENSE).
