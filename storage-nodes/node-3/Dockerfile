FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

ENV STORAGE_NODE_ID=node-3
ENV STORAGE_PORT=5003
ENV STORAGE_DIR=/data

EXPOSE 5003

CMD ["node", "src/index.js"]
