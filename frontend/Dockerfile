# Stage 1
FROM node:21-alpine as builder

WORKDIR /usr/src/app

COPY ./wait-for-backend.sh ./

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_OUTPUT=standalone

CMD ["./wait-for-backend.sh", "backend", "5004", "npm", "run", "build"]

# Stage 2: Production image
FROM node:21-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

ENV PORT 5005

EXPOSE 5005

CMD ["node", "server.js"]