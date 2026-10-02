# Distributed File Storage System

## Phase 1: Project Foundation

A cloud-based secure file sharing system with distributed storage capabilities.

### Overview

This project implements the foundation Phase 1 of a distributed file storage system, including:
- Frontend interface with React + Tailwind CSS
- Backend API with Node.js + Express
- MongoDB metadata database
- Four storage node services with health endpoints
- Docker Compose configuration for orchestration

### Quick Start

1. Install dependencies:
   ```bash
   npm install  # (in each subdirectory)
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Start MongoDB

4. Start all services:
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Backend
   cd backend && npm start
   
   # Storage nodes (four terminals)
   cd storage-nodes/node-1 && npm start
   cd storage-nodes/node-2 && npm start
   cd storage-nodes/node-3 && npm start
   cd storage-nodes/node-4 && npm start
   ```

5. Or use Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Backend Health | http://localhost:5000/api/health |
| Storage Node 1 | http://localhost:5001 |
| Storage Node 2 | http://localhost:5002 |
| Storage Node 3 | http://localhost:5003 |
| Storage Node 4 | http://localhost:5004 |

### Git Branches

- `main` → Stable code
- `develop` → Active development

### Documentation

- `docs/architecture.md` - System architecture and technology stack
- `docs/setup.md` - Local setup and installation
- `docs/development.md` - Development workflow and guidelines
- `docs/api.md` - API endpoints and responses

### Phase 1 Checklist

- [ ] Git repository initialized with main/develop branches
- [ ] Frontend runs successfully (npm run dev)
- [ ] Backend runs successfully (npm start)
- [ ] MongoDB connects successfully
- [ ] .env.example exists
- [ ] Docker Compose starts the environment
- [ ] Four storage-node services start
- [ ] Backend health endpoint works
- [ ] All storage-node health endpoints work
- [ ] Frontend loads successfully
- [ ] Project structure is clean
- [ ] Documentation exists
- [ ] No secrets are committed
## Phase 0 - 43 Audit & Repair
- Fully audited the codebase.
- Connected frontend directly to backend APIs (removed mock data).
- Fixed complete authentication, file lifecycle, and deletion operations.
- Resolved storage quota and accounting logic.
- Hardened security and IDOR checks.
- Created documentation in docs/.
