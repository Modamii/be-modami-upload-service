FROM node:24 AS development

WORKDIR /usr/src/app

COPY package*.json ./

COPY yarn.lock ./

RUN yarn install --ignore-engines

RUN yarn add glob@^10.4.5 rimraf@^5.0.9

RUN yarn global add @nestjs/cli@^9.3.0




COPY . .

RUN export NODE_OPTIONS="--max-old-space-size=5120"

RUN yarn build


FROM node:24 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

COPY yarn.lock ./

RUN yarn --production --ignore-engines

RUN yarn add @nestjs/swagger@^6.2.1 typescript@^4.7.4 ts-node@^10.0.0

COPY --from=development /usr/src/app/dist ./dist

COPY --from=development /usr/src/app/sequelize ./sequelize

COPY --from=development /usr/src/app/.sequelizerc ./.sequelizerc

CMD ["node", "dist/main.js"]
