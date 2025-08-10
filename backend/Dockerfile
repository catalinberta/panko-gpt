FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5004

CMD ["node", "dist/index.js"]