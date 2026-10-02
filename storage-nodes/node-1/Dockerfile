FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

# These defaults are overridden by docker-compose environment variables
ENV STORAGE_NODE_ID=node-1
ENV STORAGE_PORT=5001
ENV STORAGE_DIR=/data

EXPOSE 5001

CMD ["node", "src/index.js"]