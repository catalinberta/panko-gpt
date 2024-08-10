FROM node:21

WORKDIR /usr/src
RUN apt-get update \
	&& apt-get install -yq libgconf-2-4 \
	&& apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

COPY backend/src backend/src
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json
COPY backend/tsconfig.json backend/tsconfig.json

COPY frontend/src frontend/src
COPY frontend/package.json frontend/package.json
COPY frontend/package-lock.json frontend/package-lock.json
COPY frontend/tsconfig.json frontend/tsconfig.json
COPY frontend/tsconfig.node.json frontend/tsconfig.node.json
COPY frontend/vite.config.ts frontend/vite.config.ts
COPY frontend/tailwind.config.js frontend/tailwind.config.js
COPY frontend/postcss.config.js frontend/postcss.config.js
COPY frontend/index.html frontend/index.html

RUN sh -c 'cd backend && npm install'
RUN sh -c 'cd frontend && npm install --include=dev'

COPY run-script.sh ./run-script.sh
RUN chmod +x run-script.sh
CMD ./run-script.sh