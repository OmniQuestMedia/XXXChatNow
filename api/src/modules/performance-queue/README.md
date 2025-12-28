# Performance Queue Module

## Overview

The Performance Queue module implements a scalable, efficient, and reliable queue architecture for managing interactive features on the XXXChatNow platform. It supports multiple queue modes to handle varying workload patterns.

## Architecture Reference

This module implements the architecture specified in:
- `PERFORMANCE_QUEUE_ARCHITECTURE.md` (root of repository)
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- `COPILOT_GOVERNANCE.md`

## Queue Modes

The module supports three operational modes:

1. **FIFO (First-In-First-Out)**: Standard queue operation where requests are processed in the order they arrive
2. **Priority Queue**: Requests are processed based on assigned priority levels (LOW, NORMAL, HIGH, CRITICAL)
3. **Batch Processing**: Requests are accumulated and processed in batches to optimize resource utilization

## Module Structure

```
performance-queue/
├── constants.ts                    # Queue configuration and constants
├── performance-queue.module.ts     # Main NestJS module definition
├── controllers/                    # API endpoints (to be implemented)
│   └── index.ts
├── services/                       # Business logic services (to be implemented)
│   └── index.ts
├── schemas/                        # MongoDB schemas (to be implemented)
│   └── index.ts
├── dtos/                          # Data Transfer Objects (to be implemented)
│   └── index.ts
└── listeners/                     # Event listeners (to be implemented)
    └── index.ts
```

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
- **MAX_REQUESTS_PER_USER_PER_MINUTE**: 60 requests

## Design Principles

The queue architecture adheres to:

- **Scalability**: Horizontal scaling to handle varying loads
- **Fault Tolerance**: Isolated impact of failures with retry mechanisms
- **Efficiency**: Optimized throughput with minimal latency
- **Extensibility**: Support for additional modes and features

## Error Handling

The module implements:

- **Exponential Backoff**: For transient errors
- **Dead Letter Queue (DLQ)**: For failed requests requiring manual review
- **Health Checks**: Automated monitoring of critical paths

## Development Status

### Phase 1 - Scaffolding ✅
- ✅ Directory structure created
- ✅ Module configuration with dependency injection
- ✅ Constants and configuration defined
- ✅ Index files for clean imports

### Phase 2 - Core Services ✅
- ✅ MongoDB schemas for queue requests and DLQ
- ✅ PerformanceQueueService with FIFO, Priority, Batch modes
- ✅ QueueRateLimitService for distributed rate limiting
- ✅ QueueHealthService for monitoring and metrics
- ✅ Worker management with retry and exponential backoff
- ✅ Dead Letter Queue (DLQ) for failed jobs

### Phase 3 - API and Integration ✅
- ✅ REST API controllers with authentication
- ✅ Data Transfer Objects (DTOs) with validation
- ✅ Swagger/OpenAPI documentation
- ✅ Role-based access control (RBAC)
- ✅ Idempotency key support

### Phase 4 - Security Features ✅
- ✅ Authentication required for all endpoints
- ✅ Authorization checks (admin-only endpoints)
- ✅ Rate limiting with Redis
- ✅ Server-side validation
- ✅ Audit logging support

### Phase 5 (Future) - Analytics and Advanced Features
- Performance metrics dashboard
- Real-time queue monitoring
- Batch processing optimization
- Advanced retry strategies
- Queue priority rebalancing

## Dependencies

The module integrates with:

- **QueueModule**: Core queue infrastructure from kernel
- **AgendaModule**: Job scheduling
- **UserModule**: User authentication and authorization
- **AuthModule**: Authentication services
- **DBLoggerModule**: Database logging

## Usage

### Submitting Queue Requests

```typescript
// Example: Submit a message processing request
POST /performance-queue/submit
Authorization: Bearer <token>
{
  "type": "chat.message",
  "mode": "priority",
  "priority": 10,
  "payload": {
    "conversationId": "123",
    "message": "Hello!"
  },
  "idempotencyKey": "unique-key-123"
}
```

### Checking Request Status

```typescript
GET /performance-queue/status/:requestId
Authorization: Bearer <token>
```

### Registering Custom Processors

In your service/module:

```typescript
constructor(
  private readonly queueService: PerformanceQueueService
) {
  // Register processor for specific request type
  this.queueService.registerProcessor('chat.message', async (payload) => {
    // Process the message
    const result = await this.processMessage(payload);
    return result;
  });
}
```

### Admin Endpoints

```typescript
// Get queue health
GET /performance-queue/health
Authorization: Bearer <admin-token>

// Get metrics for last 60 minutes
GET /performance-queue/metrics?period=60
Authorization: Bearer <admin-token>

// View dead letter queue
GET /performance-queue/dlq?limit=50
Authorization: Bearer <admin-token>

// Mark DLQ entry as reviewed
POST /performance-queue/dlq/:dlqId/review
Authorization: Bearer <admin-token>
{
  "resolution": "Fixed and reprocessed manually"
}
```

## Security Considerations

All future implementations must adhere to:
- Server-side validation of all requests
- Authentication required for all endpoints
- Rate limiting enforcement
- Audit logging for all operations
- No sensitive data in logs

## Testing

Tests will be implemented in future phases alongside service logic.
