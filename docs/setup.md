# Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Docker (optional, for containerized deployment)
- npm or yarn

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd distributed-file-storage
git checkout develop
```

### 2. Environment Configuration

Copy the environment example file and configure values:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/distributed_file_storage
MONGODB_DATABASE=distributed_file_storage
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change_this_later
STORAGE_NODE_1_URL=http://localhost:5001
STORAGE_NODE_2_URL=http://localhost:5002
STORAGE_NODE_3_URL=http://localhost:5003
STORAGE_NODE_4_URL=http://localhost:5004
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Install Backend Dependencies

```bash
cd ../backend
npm install
```

### 5. Install Storage Node Dependencies

```bash
cd ../storage-nodes/node-1
npm install

cd ../node-2
npm install

cd ../node-3
npm install

cd ../node-4
npm install
```

### 6. Start MongoDB

If using local MongoDB:

```bash
mongod --dbpath ./data
```

Or start MongoDB Docker container:

```bash
docker run -d -p 27017:27017 --name mongo mongo:7.0
```

### 7. Start the Development Servers

#### Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

#### Backend

```bash
cd backend
npm start
```

The backend will be available at http://localhost:5000/api/health

#### Storage Nodes

```bash
# Node 1
cd storage-nodes/node-1
npm start

# Node 2
cd storage-nodes/node-2
npm start

# Node 3
cd storage-nodes/node-3
npm start

# Node 4
cd storage-nodes/node-4
npm start
```

All storage nodes will be available at their respective health endpoints:
- http://localhost:5001/internal/health
- http://localhost:5002/internal/health
- http://localhost:5003/internal/health
- http://localhost:5004/internal/health

### 8. Docker Compose

To start all services with Docker Compose:

```bash
docker-compose up -d
```

To stop:

```bash
docker-compose down
```

## Verification

After starting all services, verify:

1. Frontend loads at http://localhost:5173
2. Backend health at http://localhost:5000/api/health
3. MongoDB connection in backend logs
4. Storage node health at respective ports