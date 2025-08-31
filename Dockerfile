FROM node:21-alpine AS frontend-builder
WORKDIR /usr/src/app/frontend

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend .

RUN npm run build

FROM node:21-alpine AS backend-builder
WORKDIR /usr/src/app/backend

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    dumb-init

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY ./backend/package*.json ./

RUN npm install

COPY ./backend .

RUN npm run build

FROM node:21-alpine

RUN apk add --no-cache dumb-init chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont udev

WORKDIR /usr/src/app

COPY --from=backend-builder /usr/src/app/backend/dist ./backend/dist
COPY --from=backend-builder /usr/src/app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /usr/src/app/backend/package*.json ./backend/

COPY --from=frontend-builder /usr/src/app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /usr/src/app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /usr/src/app/frontend/public ./frontend/public

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PORT 5005

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY ./docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 5004 5005

CMD dumb-init sh -c "\
    node backend/dist/index.js & \
    node frontend/server.js \
"