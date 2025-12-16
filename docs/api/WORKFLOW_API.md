# Workflow Management API Documentation

## Overview

The Workflow Management API provides a comprehensive interface for managing GitHub Actions workflows, specifically designed to identify and clean up inactive workflow runs. This API is part of the RedRoomRewards system and follows all security and engineering standards defined in the repository governance.

## Purpose

This API addresses the need to:
1. **Identify inactive workflows** - Find workflow runs that haven't been updated in a configurable time period
2. **Clean up workflow history** - Delete old or inactive workflow runs to reduce clutter
3. **Manage workflow state** - Enable or disable workflows as needed
4. **Monitor workflow activity** - Get insights into workflow usage patterns

## Architecture

The API follows a clean architecture pattern with clear separation of concerns:

```
src/api/
├── config/           # Configuration files
├── controllers/      # HTTP request handlers
├── services/         # Business logic and GitHub API integration
├── routes/           # Express route definitions
├── middleware/       # Authentication, rate limiting, error handling
└── server.js         # Main application entry point
```

## Technical Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **GitHub Integration**: Octokit (@octokit/rest)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## Security Features

### Authentication
- All endpoints require GitHub Personal Access Token (PAT)
- Token must be provided in `Authorization` header as Bearer token
- Required GitHub permissions: `repo`, `workflow`

### Rate Limiting
- General endpoints: 100 requests per 15 minutes per IP
- Deletion endpoints: 50 requests per hour per IP
- Rate limit headers included in all responses

### Input Validation
- All parameters are validated before processing
- SQL injection prevention through parameterized queries
- XSS prevention through proper encoding

### Audit Logging
- All operations are logged with:
  - User identification (via token)
  - Operation type
  - Timestamp
  - Result (success/failure)

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `WORKFLOW_INACTIVITY_THRESHOLD_DAYS` | Days before workflow is considered inactive | 90 | No |
| `MAX_WORKFLOW_RUNS_PER_PAGE` | Maximum runs per API request | 100 | No |
| `WORKFLOW_SOFT_DELETE` | Enable soft delete (mark for deletion) | false | No |
| `GITHUB_API_BASE_URL` | GitHub API base URL | https://api.github.com | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | * | No |

### Inactivity Threshold

The default inactivity threshold is 90 days, meaning any workflow run that hasn't been updated in 90+ days is considered inactive. This can be customized:

- **Globally**: Set `WORKFLOW_INACTIVITY_THRESHOLD_DAYS` environment variable
- **Per Request**: Pass `inactivityDays` parameter in API calls

## API Endpoints Reference

### Base URL
```
http://localhost:3000/api/workflows
```

### Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/inactive` | Get inactive workflow runs |
| GET | `/:owner/:repo` | List all workflows |
| DELETE | `/:owner/:repo/runs/:runId` | Delete single workflow run |
| POST | `/:owner/:repo/runs/delete` | Delete multiple workflow runs |
| POST | `/:owner/:repo/cleanup` | Cleanup all inactive workflows |
| POST | `/:owner/:repo/:workflowId/disable` | Disable a workflow |
| POST | `/:owner/:repo/:workflowId/enable` | Enable a workflow |

For detailed endpoint documentation, see [API README](../../src/api/README.md).

## Usage Examples

### Example 1: Find Inactive Workflows

```bash
curl -X GET \
  "http://localhost:3000/api/workflows/inactive?owner=OmniQuestMedia&repo=XXXChatNow&inactivityDays=60" \
  -H "Authorization: Bearer ghp_your_token_here"
```

### Example 2: Clean Up All Inactive Workflows

```bash
curl -X POST \
  http://localhost:3000/api/workflows/OmniQuestMedia/XXXChatNow/cleanup \
  -H "Authorization: Bearer ghp_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"inactivityDays": 90}'
```

### Example 3: Disable a Workflow

```bash
curl -X POST \
  http://localhost:3000/api/workflows/OmniQuestMedia/XXXChatNow/old-ci.yml/disable \
  -H "Authorization: Bearer ghp_your_token_here"
```

## Error Handling

All errors follow a consistent structure:

```json
{
  "error": "Error message describing what went wrong",
  "path": "/api/workflows/owner/repo",
  "timestamp": "2024-12-16T07:00:00.000Z"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Missing required parameters, invalid input |
| 401 | Unauthorized | Missing or invalid GitHub token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Repository, workflow, or run not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error, GitHub API issues |

## Performance Considerations

### Pagination
- GitHub API returns up to 100 workflow runs per request
- For repositories with many workflow runs, consider:
  - Processing in batches
  - Implementing pagination in client
  - Scheduling cleanup jobs during off-peak hours

### Rate Limits
- GitHub API has rate limits (5000 requests/hour for authenticated users)
- API implements its own rate limiting to prevent abuse
- Use batch operations (delete multiple runs) when possible

### Response Times
- List workflows: ~100-500ms
- Get inactive workflows: ~500-2000ms (depends on number of runs)
- Delete single run: ~200-500ms
- Cleanup operation: ~5-30s (depends on number of runs to delete)

## Best Practices

### Token Management
1. Use dedicated service account tokens
2. Grant minimal required permissions
3. Rotate tokens regularly
4. Never commit tokens to version control
5. Store tokens securely (environment variables, secret managers)

### Cleanup Strategy
1. **Test First**: Use `GET /inactive` to preview what will be deleted
2. **Start Conservative**: Begin with longer inactivity threshold (e.g., 180 days)
3. **Schedule Regular Cleanups**: Automate cleanup to prevent accumulation
4. **Monitor Results**: Review cleanup results for any unexpected deletions
5. **Keep Important Runs**: Consider keeping runs from main/production branches

### Error Recovery
1. Handle partial failures gracefully
2. Log all operations for audit trail
3. Implement retry logic for transient failures
4. Alert on repeated failures

## Integration Guide

### Node.js Integration

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/workflows';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function cleanupInactiveWorkflows(owner, repo, inactivityDays = 90) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/${owner}/${repo}/cleanup`,
      { inactivityDays },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Cleanup result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Cleanup failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
cleanupInactiveWorkflows('OmniQuestMedia', 'XXXChatNow', 90)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### Python Integration

```python
import requests
import os

API_BASE_URL = 'http://localhost:3000/api/workflows'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')

def cleanup_inactive_workflows(owner, repo, inactivity_days=90):
    url = f'{API_BASE_URL}/{owner}/{repo}/cleanup'
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Content-Type': 'application/json'
    }
    payload = {'inactivityDays': inactivity_days}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Cleanup failed: {e}')
        raise

# Usage
result = cleanup_inactive_workflows('OmniQuestMedia', 'XXXChatNow', 90)
print(f'Cleanup result: {result}')
```

### GitHub Actions Integration

Create a scheduled workflow to automatically clean up inactive runs:

```yaml
name: Cleanup Inactive Workflows
on:
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sunday at midnight
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Inactive Workflows
        run: |
          curl -X POST \
            http://your-api-domain.com/api/workflows/${{ github.repository_owner }}/${{ github.event.repository.name }}/cleanup \
            -H "Authorization: Bearer ${{ secrets.WORKFLOW_CLEANUP_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"inactivityDays": 90}'
```

## Monitoring and Observability

### Health Checks
```bash
curl http://localhost:3000/health
```

### Metrics to Monitor
- Request rate and latency
- Error rate by endpoint
- Number of workflow runs deleted
- GitHub API rate limit usage
- Server uptime and resource usage

### Logging
All operations are logged with structured data:
```json
{
  "timestamp": "2024-12-16T07:00:00.000Z",
  "level": "info",
  "operation": "cleanup_inactive_workflows",
  "owner": "OmniQuestMedia",
  "repo": "XXXChatNow",
  "deleted": 25,
  "failed": 0
}
```

## Troubleshooting

### Issue: "GitHub token required"
**Solution**: Ensure token is provided in Authorization header as `Bearer ghp_token`

### Issue: "Too many requests"
**Solution**: You've hit the rate limit. Wait for the reset time (check `RateLimit-Reset` header)

### Issue: "Insufficient permissions"
**Solution**: Token needs `repo` and `workflow` scopes

### Issue: No inactive workflows found
**Solution**: Either no workflows are inactive, or inactivity threshold is too high. Try lowering `inactivityDays`

### Issue: Cleanup taking too long
**Solution**: Repository has many workflow runs. Consider:
- Running during off-peak hours
- Increasing inactivity threshold to reduce number of deletions
- Processing in smaller batches

## Future Enhancements

Planned improvements:
1. Batch deletion optimization
2. Webhook integration for real-time workflow monitoring
3. Analytics dashboard for workflow usage
4. Scheduled cleanup jobs
5. Custom retention policies per workflow
6. Export workflow history before deletion
7. Dry-run mode for testing cleanup without actual deletion

## Support

For technical support or questions:
- Technical: tuong.tran@outlook.com
- General: general@OQMINC.com

## Related Documentation

- [Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)
- [Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [API Implementation](/src/api/README.md)
- [Contributing Guide](/CONTRIBUTING.md)
