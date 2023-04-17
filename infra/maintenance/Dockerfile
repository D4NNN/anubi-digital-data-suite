FROM node:16-alpine as base

RUN apk add --no-cache postgresql-client --repository=http://dl-cdn.alpinelinux.org/alpine/v3.14/main \
    && apk add --no-cache tini

# Copy anubi-ci cli
COPY ./cli /usr/src/app/cli

# Install dependencies
COPY ./infra/maintenance/package.json ./infra/maintenance/yarn.lock /usr/src/app/

WORKDIR /usr/src/app
RUN yarn install --frozen-lockfile && yarn cache clean

FROM base as build

COPY ./infra/maintenance /usr/src/app/
RUN yarn build

FROM build as dist

WORKDIR /usr/src/app
ENTRYPOINT ["/sbin/tini", "--"]
