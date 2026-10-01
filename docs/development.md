# Development Guide

## Project Structure

```
distributed-file-storage/
├── frontend/           # React + Vite + Tailwind CSS
├── backend/            # Node.js + Express.js
├── storage-nodes/      # Four independent storage node services
├── docker/             # Docker configuration
├── docs/               # Project documentation
├── tests/              # Test suites
├── .env.example        # Environment configuration examples
├── .gitignore          # Git ignore rules
├── docker-compose.yml  # Docker orchestration
└── README.md
```

## Development Workflow

### Branch Management

- **main** → Stable code, production-ready
- **develop** → Active development branch

Always work on the `develop` branch for new features. Merge to `main` when features are complete and tested.

### Adding New Features

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

2. Implement the feature

3. Test your changes

4. Merge to `develop`:
   ```bash
   git checkout develop
   git merge feature/your-feature-name
   git push origin develop
   ```

### Adding Configuration

1. Add environment variables to `.env` (never commit real secrets)
2. Update `.env.example` if adding new config values
3. Reference environment variables using `process.env.VAR_NAME`

### Code Standards

- Use ESLint for linting (`npm run lint` if configured)
- Format code with Prettier
- Follow consistent API naming conventions
- Use centralized error handling via the error middleware
- Write meaningful comments where needed

### Adding New Storage Nodes

1. Create a new directory under `storage-nodes/` (e.g., `node-5/`)
2. Add a Dockerfile with the appropriate port environment variable
3. Update `docker-compose.yml` to include the new node
4. Add environment variables `STORAGE_NODE_5_URL`, etc. to `.env.example`

### Frontend Development

- Run `npm run dev` in the `frontend/` directory
- Vite provides hot module replacement (HMR)
- Components are in `src/components/`
- Pages are in `src/pages/`
- Tailwind CSS classes are used for styling

### Backend Development

- Run `npm start` in the `backend/` directory
- Express server initialized at `src/index.js`
- API routes in `src/routes/`
- Controllers in `src/controllers/`
- Middleware in `src/middleware/`
- Models in `src/models/`
- Configuration in `src/config/`

## Available Scripts

### Frontend (frontend/)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production

### Backend (backend/)

- `npm start` - Start Express server
- `npm test` - Run tests

### Storage Nodes (storage-nodes/node-X/)

- `npm start` - Start storage node server

## Debugging

- Check backend logs for MongoDB connection errors
- Verify storage node health at `/internal/health` endpoint
- Use `docker logs` to check container output
- Environment variables are logged at startup (`◇ injected env` from dotenv)