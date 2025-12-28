# Performance Queue Module

## Overview

The Performance Queue Module provides a high-priority queuing system for the XXXChatNow platform. It handles message delivery, notifications, and asynchronous background task processing with high concurrency and low latency.

## Features

### Core Features
- **Multiple Queue Modes**: FIFO, Priority, and Batch processing
- **High Concurrency**: Configurable worker pools with concurrent job processing
- **Reliability**: At-least-once and at-most-once delivery guarantees
- **Retry Mechanism**: Exponential backoff for failed tasks (up to 3 attempts)
- **Dead Letter Queue**: Failed jobs after max retries are logged for manual review

### Security Features
- **Authentication Required**: All endpoints require user authentication
- **Rate Limiting**: 60 requests per user per minute
- **Idempotency Support**: Prevents duplicate operations via idempotency keys
- **Authorization Checks**: Users can only access their own requests
- **Audit Logging**: Complete audit trail for all queue operations

### Monitoring & Metrics
- **Health Checks**: Real-time queue health monitoring
- **Performance Metrics**: Throughput, latency, retries, and failure rates
- **Detailed Analytics**: Metrics breakdown by status and job type
- **Data Retention**: Automatic archival of old records

## Architecture

This module implements the architecture specified in:
- `PERFORMANCE_QUEUE_ARCHITECTURE.md` (root of repository)
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- `COPILOT_GOVERNANCE.md`

The module implements:

1. **Queue Manager**: Oversees overall operation (PriorityQueueService)
2. **Scheduler**: Ensures efficient and timely processing (bee-queue integration)
3. **Resiliency Layer**: Fail-safe and retry mechanisms
4. **Metrics Dashboard**: Performance tracking and analytics

## Module Structure

```
performance-queue/
├── constants.ts                           # Queue configuration and constants
├── performance-queue.module.ts            # Main NestJS module definition
├── controllers/
│   ├── performance-queue.controller.ts    # ✅ API endpoints
│   └── index.ts
├── services/
│   ├── priority-queue.service.ts          # ✅ Core queue service
│   ├── priority-queue.service.spec.ts     # ✅ Unit tests
│   ├── queue-metrics.service.ts           # ✅ Metrics service
│   ├── queue-metrics.service.spec.ts      # ✅ Unit tests
│   └── index.ts
├── schemas/
│   ├── queue-request.schema.ts            # ✅ MongoDB schema
│   ├── queue-metrics.schema.ts            # ✅ MongoDB schema
│   └── index.ts
├── dtos/
│   ├── queue-request.dto.ts               # ✅ Data Transfer Objects
│   └── index.ts
└── listeners/
    ├── performance-queue.listener.ts      # ✅ Event listeners
    └── index.ts
```

## API Endpoints

### Submit Request
```
POST /performance-queue/submit
```
Submit a new request to the queue with priority and mode options.

**Authentication**: Required

**Request Body**:
```json
{
  "type": "notification",
  "payload": { "userId": "...", "message": "..." },
  "mode": "priority",
  "priority": 10,
  "idempotencyKey": "unique-key-123",
  "metadata": {}
}
```

**Response**:
```json
{
  "requestId": "uuid",
  "status": "pending",
  "message": "Request queued successfully"
}
```

### Get Request Status
```
GET /performance-queue/request/:requestId
```
Get the status of a specific request.

**Authentication**: Required  
**Authorization**: Owner only

### Cancel Request
```
DELETE /performance-queue/request/:requestId
```
Cancel a pending request.

**Authentication**: Required  
**Authorization**: Owner only

### Health Check
```
GET /performance-queue/health
```
Get queue health status (public endpoint for monitoring).

**Response**:
```json
{
  "healthy": true,
  "queueDepth": 10,
  "activeWorkers": 3,
  "averageWaitTimeMs": 150,
  "averageProcessingTimeMs": 200,
  "failureRate": 0.02,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Metrics Endpoints
- `GET /performance-queue/metrics/hourly` - Last hour metrics
- `GET /performance-queue/metrics/daily` - Last 24 hours metrics
- `GET /performance-queue/metrics/detailed?startDate=...&endDate=...` - Custom range with breakdown
- `GET /performance-queue/metrics/by-type?startDate=...&endDate=...` - Metrics by job type

## Configuration Constants

Key configuration values defined in `constants.ts`:

- **MAX_QUEUE_DEPTH**: 10,000 requests
- **QUEUE_TIMEOUT_MS**: 30,000ms (30 seconds)
- **PROCESSING_TIMEOUT_MS**: 60,000ms (60 seconds)
- **ROPE_DROP_TIMEOUT_MS**: 5,000ms (5 seconds)
- **BATCH_SIZE**: 100 requests per batch
- **BATCH_INTERVAL_MS**: 1,000ms between batches
- **MAX_CONCURRENT_WORKERS**: 10 workers
- **MAX_RETRY_ATTEMPTS**: 3 attempts
- **RETRY_BACKOFF_MS**: 1,000ms initial backoff
- **MAX_REQUESTS_PER_USER_PER_MINUTE**: 60 requests

## Environment Configuration

The queue uses Redis configuration from environment variables:
- `REDIS_HOST`: Redis server host (default: 127.0.0.1)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_DB`: Redis database number (default: 0)
- `REDIS_PREFIX`: Key prefix for queue data (default: bq)

## Design Principles

The queue architecture adheres to:

- **Scalability**: Horizontal scaling to handle varying loads
- **Fault Tolerance**: Isolated impact of failures with retry mechanisms
- **Efficiency**: Optimized throughput with minimal latency
- **Extensibility**: Support for additional modes and features

## Usage Examples

### Submitting a Request
```typescript
import { PriorityQueueService } from './modules/performance-queue/services';

// In your service
constructor(
  private readonly queueService: PriorityQueueService
) {}

async sendNotification(userId: ObjectId, message: string) {
  const result = await this.queueService.submitRequest(userId, {
    type: 'notification',
    payload: { message },
    mode: QUEUE_MODE.PRIORITY,
    priority: PRIORITY_LEVEL.HIGH,
    idempotencyKey: `notif-${userId}-${Date.now()}`,
    metadata: { source: 'user-action' }
  });
  
  return result;
}
```

### Checking Request Status
```typescript
const status = await this.queueService.getRequestStatus(requestId, userId);
console.log(`Status: ${status.status}`);
```

### Getting Metrics
```typescript
import { QueueMetricsService } from './modules/performance-queue/services';

// In your controller
async getQueueStats() {
  const hourlyMetrics = await this.metricsService.getHourlyMetrics();
  const dailyMetrics = await this.metricsService.getDailyMetrics();
  
  return { hourly: hourlyMetrics, daily: dailyMetrics };
}
```

## Data Retention

The module follows the retention policy defined in `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`:

- **Transaction Records**: Keep locally for 18 months
- **Long-term Storage**: Export to cold storage for 6.5 years (total 8 years)
- **Archival**: Old completed/failed requests are marked as archived rather than deleted
- **Metrics**: Historical metrics can be archived for analysis

Use `QueueMetricsService.cleanupOldRequests()` and `archiveOldMetrics()` for maintenance.

## Security Considerations

All implementations adhere to:
- **Server-side validation** of all requests
- **Authentication required** for all endpoints
- **Rate limiting** enforcement (60 req/user/min)
- **Audit logging** for all operations
- **No sensitive data** in logs
- **Idempotency keys** for preventing duplicates
- **Authorization checks** - users can only access their own requests

### No Backdoors
- No master passwords or magic authentication strings
- No hidden override credentials
- All access requires proper authentication

## Testing

The module includes comprehensive unit tests:

```bash
# Run all performance queue tests
npm test -- --testPathPattern=performance-queue

# Run specific test file
npm test -- priority-queue.service.spec.ts
```

**Test Coverage**: 29 passing tests covering:
- Request submission with validation
- Authentication and authorization
- Rate limiting enforcement
- Idempotency handling
- Request status retrieval
- Request cancellation
- Health checks
- Metrics calculation

## Extending the Queue

To add a new job type:

1. Define the job type in `constants.ts`
2. Implement the handler in `PriorityQueueService.executeJob()`
3. Add validation for the new job type
4. Update tests to cover the new job type

Example:
```typescript
// In constants.ts
export const JOB_TYPE = {
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  // Add new type
  PAYMENT_PROCESSING: 'payment_processing'
};

// In priority-queue.service.ts
private async executeJob(job: QueueJob): Promise<any> {
  switch (job.type) {
    case JOB_TYPE.PAYMENT_PROCESSING:
      return this.processPayment(job.payload);
    // ... other cases
  }
}
```

## Dependencies

The module integrates with:

- **QueueModule**: Core queue infrastructure from kernel (bee-queue)
- **AgendaModule**: Job scheduling
- **UserModule**: User authentication and authorization
- **AuthModule**: Authentication services
- **DBLoggerModule**: Database logging

## Development Status

### ✅ Phase 1 - Core Queue Infrastructure
- Queue request and metrics schemas
- Priority queue service with concurrency management
- Exponential backoff retry mechanism
- Dead letter queue support

### ✅ Phase 2 - Security & Access Control
- Authentication for producers/consumers
- Rate limiting per user
- Idempotency key support
- Audit logging
- Least-privilege access control

### ✅ Phase 3 - Monitoring & Metrics
- Metrics tracking service
- Health check endpoints
- Analytics/dashboard data endpoints
- Detailed logging

### ✅ Phase 4 - Integration & Testing
- DTOs for requests/responses
- Controllers for queue management
- Comprehensive unit tests (29 tests)
- Event listeners

## Support

For issues or questions about the queue module, refer to the main repository documentation or create an issue following the guidelines in `CONTRIBUTING.md`.
