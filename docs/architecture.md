# Distributed File Storage System

## Project Purpose

A cloud-based secure file sharing system designed for distributed storage with replication,
monitoring, and recovery capabilities. The system enables reliable file storage across multiple
storage nodes with fault tolerance and adaptive placement strategies.

## Architecture

```text
React + Tailwind
        ↓
Node.js + Express
        ↓
MongoDB Metadata
        ↓
File Processing
        ↓
Placement Engine
        ↓
Storage Node 1/2/3/4
        ↓
Replication + Monitoring + Recovery
```

## Technologies

- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **Database**: MongoDB for metadata storage
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, integration tests

## Phase 1 Features

- Project structure initialization
- Frontend application shell with React + Tailwind
- Backend API with health endpoint
- MongoDB connection configuration
- Four storage node services with health endpoints
- Docker Compose configuration
- Environment configuration
- Basic documentation

## Phase 2 Features (Planned)

- JWT authentication and user management
- File upload and download APIs
- File chunking and processing
- Placement engine (Round Robin, Adaptive)
- Replication across storage nodes
- Failure recovery and monitoring
- Audit logging

## Service Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Backend | 5000 |
| MongoDB | 27017 |
| Storage Node 1 | 5001 |
| Storage Node 2 | 5002 |
| Storage Node 3 | 5003 |
| Storage Node 4 | 5004 |

All ports are configurable through environment variables.