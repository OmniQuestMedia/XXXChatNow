# Workflow Management API

A REST API for managing GitHub Actions workflows, including the ability to identify, close, and delete inactive workflow runs.

## Features

- **List Workflows**: Get all workflows in a repository
- **Identify Inactive Workflows**: Find workflow runs that haven't been updated in a configurable time period
- **Delete Workflow Runs**: Remove individual or multiple workflow runs
- **Cleanup Automation**: Automatically delete all inactive workflow runs
- **Workflow Control**: Enable or disable workflows
- **Security**: Rate limiting and authentication via GitHub tokens
- **Audit Trail**: Complete logging of all operations

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

## Configuration

Configure the API using environment variables:

```bash
# Server configuration
PORT=3000
NODE_ENV=production

# Workflow settings
WORKFLOW_INACTIVITY_THRESHOLD_DAYS=90
MAX_WORKFLOW_RUNS_PER_PAGE=100
WORKFLOW_SOFT_DELETE=false

# GitHub API
GITHUB_API_BASE_URL=https://api.github.com

# Security
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

## Authentication

All API endpoints require a GitHub personal access token (PAT) with the following permissions:

- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)

Include the token in the Authorization header:

```
Authorization: Bearer ghp_YourGitHubTokenHere
```

## API Endpoints

### 1. List All Workflows

Get all workflows in a repository.

**Endpoint:** `GET /api/workflows/:owner/:repo`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name

**Example:**
```bash
curl -X GET \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow \
  -H "Authorization: Bearer ghp_token"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "workflows": [
    {
      "id": 12345,
      "name": "CodeQL",
      "path": ".github/workflows/codeql.yml",
      "state": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-12-01T00:00:00Z",
      "html_url": "https://github.com/owner/repo/actions/workflows/12345"
    }
  ]
}
```

### 2. Get Inactive Workflow Runs

Identify workflow runs that haven't been updated recently.

**Endpoint:** `GET /api/workflows/inactive`

**Query Parameters:**
- `owner` (required) - Repository owner
- `repo` (required) - Repository name
- `inactivityDays` (optional) - Number of days to consider as inactive (default: 90)

**Example:**
```bash
curl -X GET \
  "https://api.example.com/api/workflows/inactive?owner=OmniQuestMedia&repo=XXXChatNow&inactivityDays=60" \
  -H "Authorization: Bearer ghp_token"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "workflows": [
    {
      "id": 67890,
      "name": "CI",
      "status": "completed",
      "conclusion": "success",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-06-01T00:00:00Z",
      "html_url": "https://github.com/owner/repo/actions/runs/67890"
    }
  ]
}
```

### 3. Delete Single Workflow Run

Delete a specific workflow run.

**Endpoint:** `DELETE /api/workflows/:owner/:repo/runs/:runId`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `runId` (path) - Workflow run ID

**Example:**
```bash
curl -X DELETE \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow/runs/67890 \
  -H "Authorization: Bearer ghp_token"
```

**Response:**
```json
{
  "success": true,
  "runId": 67890,
  "message": "Workflow run deleted successfully"
}
```

### 4. Delete Multiple Workflow Runs

Delete multiple workflow runs in a single request.

**Endpoint:** `POST /api/workflows/:owner/:repo/runs/delete`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name

**Body:**
```json
{
  "runIds": [67890, 67891, 67892]
}
```

**Example:**
```bash
curl -X POST \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow/runs/delete \
  -H "Authorization: Bearer ghp_token" \
  -H "Content-Type: application/json" \
  -d '{"runIds": [67890, 67891, 67892]}'
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "successful": [67890, 67891],
  "failed": [
    {
      "runId": 67892,
      "error": "Failed to delete workflow run 67892: Not found"
    }
  ]
}
```

### 5. Cleanup Inactive Workflows

Automatically delete all inactive workflow runs.

**Endpoint:** `POST /api/workflows/:owner/:repo/cleanup`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name

**Body (optional):**
```json
{
  "inactivityDays": 60
}
```

**Example:**
```bash
curl -X POST \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow/cleanup \
  -H "Authorization: Bearer ghp_token" \
  -H "Content-Type: application/json" \
  -d '{"inactivityDays": 60}'
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed: 10 deleted, 0 failed",
  "total": 10,
  "successful": [67890, 67891, 67892, 67893, 67894, 67895, 67896, 67897, 67898, 67899],
  "failed": []
}
```

### 6. Disable Workflow

Disable a workflow to prevent it from running.

**Endpoint:** `POST /api/workflows/:owner/:repo/:workflowId/disable`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `workflowId` (path) - Workflow ID or filename (e.g., "codeql.yml")

**Example:**
```bash
curl -X POST \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow/codeql.yml/disable \
  -H "Authorization: Bearer ghp_token"
```

**Response:**
```json
{
  "success": true,
  "workflowId": "codeql.yml",
  "message": "Workflow disabled successfully"
}
```

### 7. Enable Workflow

Enable a previously disabled workflow.

**Endpoint:** `POST /api/workflows/:owner/:repo/:workflowId/enable`

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `workflowId` (path) - Workflow ID or filename (e.g., "codeql.yml")

**Example:**
```bash
curl -X POST \
  https://api.example.com/api/workflows/OmniQuestMedia/XXXChatNow/codeql.yml/enable \
  -H "Authorization: Bearer ghp_token"
```

**Response:**
```json
{
  "success": true,
  "workflowId": "codeql.yml",
  "message": "Workflow enabled successfully"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API endpoints**: 100 requests per 15 minutes per IP
- **Deletion endpoints**: 50 requests per hour per IP

Rate limit information is returned in response headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Timestamp when the limit resets

## Error Handling

All errors return a consistent format:

```json
{
  "error": "Error message",
  "path": "/api/workflows/owner/repo",
  "timestamp": "2024-12-16T07:00:00.000Z"
}
```

Common status codes:
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid GitHub token)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security Considerations

1. **Authentication**: Always use a GitHub token with minimal required permissions
2. **Token Storage**: Never commit tokens to source control; use environment variables
3. **Rate Limiting**: Respect rate limits to avoid being blocked
4. **Audit Logging**: All operations are logged for security auditing
5. **HTTPS**: Always use HTTPS in production
6. **Token Rotation**: Regularly rotate GitHub tokens

## Health Check

Check if the API is running:

**Endpoint:** `GET /health`

**Example:**
```bash
curl -X GET https://api.example.com/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-16T07:00:00.000Z",
  "uptime": 3600
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test
```

## Deployment

1. Set required environment variables
2. Ensure Node.js 18+ is installed
3. Install dependencies: `npm install --production`
4. Start the server: `npm start`

For production deployments, consider:
- Using a process manager (PM2, systemd)
- Setting up reverse proxy (nginx)
- Implementing proper logging
- Setting up monitoring and alerts
- Using a container orchestration platform (Docker, Kubernetes)

## License

UNLICENSED - Proprietary software of OmniQuest Media

## Support

- Technical: tuong.tran@outlook.com
- General: general@OQMINC.com
