FROM node:20.19.0-alpine AS development

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_STATIC_BINARY_PATH=/usr/bin/ffmpeg
ENV FFMPEG_STATIC_SKIP_DOWNLOAD=true

RUN --mount=type=cache,target=/root/.yarn \
    YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

COPY . .

RUN yarn build


FROM node:20.19.0-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_STATIC_BINARY_PATH=/usr/bin/ffmpeg

COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/sequelize ./sequelize
COPY --from=development /usr/src/app/.sequelizerc ./.sequelizerc
COPY --from=development /usr/src/app/scripts ./scripts

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]