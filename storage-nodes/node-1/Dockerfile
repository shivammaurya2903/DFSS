FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

ENV STORAGE_NODE_ID=node-1
ENV STORAGE_PORT=5001
ENV STORAGE_DIR=/data/storage

EXPOSE 5001

VOLUME ["/data/storage"]

CMD ["node", "src/index.js"]