FROM node:24-alpine AS development

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++ postgresql-dev perl

COPY package*.json ./

COPY yarn.lock ./

RUN yarn install --ignore-engines

RUN yarn add glob@^10.4.5 rimraf@^5.0.9

RUN yarn global add @nestjs/cli@^9.3.0

COPY . .

RUN NODE_OPTIONS="--max-old-space-size=5120" yarn build


FROM node:24-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apk add --no-cache libpq perl

WORKDIR /usr/src/app

COPY package*.json ./

COPY yarn.lock ./

RUN yarn --production --ignore-engines

COPY --from=development /usr/src/app/dist ./dist

COPY --from=development /usr/src/app/sequelize ./sequelize

COPY --from=development /usr/src/app/.sequelizerc ./.sequelizerc

CMD ["node", "dist/main.js"]
