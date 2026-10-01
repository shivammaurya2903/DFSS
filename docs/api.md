# API Documentation

## Base URL

`http://localhost:5000/api`

## Endpoints

### Health Check

`GET /api/health`

#### Response

```json
{
  "success": true,
  "service": "distributed-file-storage-backend",
  "status": "healthy"
}
```

#### Status Codes

- `200` - Service is healthy

### Storage Node Health

`GET /internal/health` (on each storage node)

#### Response

```json
{
  "nodeId": "node-1",
  "status": "healthy"
}
```

#### Ports

- Storage Node 1: `http://localhost:5001/internal/health`
- Storage Node 2: `http://localhost:5002/internal/health`
- Storage Node 3: `http://localhost:5003/internal/health`
- Storage Node 4: `http://localhost:5004/internal/health`

## API Versioning

All API endpoints are prefixed with `/api` to allow for versioning in future phases.
Backend is currently at version `v1` with the prefix `/api`.

## Error Responses

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Error status codes:
- `400` - Bad request
- `404` - Not found
- `500` - Internal server error