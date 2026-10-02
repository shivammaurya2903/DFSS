FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

ENV STORAGE_NODE_ID=node-4
ENV STORAGE_PORT=5004
ENV STORAGE_DIR=/data

EXPOSE 5004

CMD ["node", "src/index.js"]
