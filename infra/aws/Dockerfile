FROM node:16-alpine as development_build

ENV PROJ_ROOT_DIR=/

# Get the necessary build tools
# RUN apk add build-base autoconf automake libtool pkgconfig nasm

# Add the package.json file and build the node_modules folder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY . /app

# build files to serve in production
FROM development_build as production_build

RUN yarn build
