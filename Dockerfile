FROM node:20.19.0 AS development

WORKDIR /usr/src/app

COPY package*.json ./

COPY yarn.lock ./

RUN apt-get update && apt-get install -y libpq-dev ffmpeg xz-utils && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_STATIC_BINARY_PATH=/usr/bin/ffmpeg

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn add glob@^10.4.5 rimraf@^5.0.9

RUN yarn global add @nestjs/cli@^9.3.0

COPY . .

RUN export NODE_OPTIONS="--max-old-space-size=5120"

RUN yarn build


FROM node:20.19.0 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y libpq-dev ffmpeg xz-utils && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_STATIC_BINARY_PATH=/usr/bin/ffmpeg

COPY --from=development /usr/src/app/node_modules ./node_modules

COPY --from=development /usr/src/app/dist ./dist

COPY --from=development /usr/src/app/sequelize ./sequelize

COPY --from=development /usr/src/app/.sequelizerc ./.sequelizerc

COPY --from=development /usr/src/app/scripts ./scripts

CMD ["node", "dist/main.js"]
