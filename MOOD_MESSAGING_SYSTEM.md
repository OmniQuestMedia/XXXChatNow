# Model Mood Messaging System - Complete Specification

## Overview

The Model Mood Messaging System (MMRS) is an automated response system that enables models (performers) to send contextually appropriate pre-configured messages to users based on mood categories. The system provides quick, professional responses while maintaining model engagement and reducing response time.

## Purpose

- **Reduce Response Time**: Enable models to respond quickly with appropriate messages
- **Maintain Engagement**: Keep users engaged with timely responses
- **Personalization**: Allow models to customize responses for different mood contexts
- **Analytics**: Track usage patterns for optimization

## Core Components

### 1. Mood Buckets

Mood buckets are predefined categories of responses that models can use. Each bucket contains multiple response templates.

#### Default Mood Buckets

1. **Happy Mood**
   - Responses for users in positive, cheerful moods
   - Upbeat and enthusiastic tone
   
2. **Sad Mood**
   - Empathetic responses for users seeking comfort
   - Supportive and understanding tone

3. **Angry/Frustrated Mood**
   - Calming responses for frustrated users
   - Patient and de-escalating tone

4. **Neutral/Casual Mood**
   - General-purpose responses
   - Friendly and professional tone

### 2. Response Types

#### Public Gratitude Responses
- Visible to all users in public chat
- Used for thanking users for tips, gifts, or support
- Professional and appreciative tone

#### Private Micro-Responses
- Sent in private messages
- Quick acknowledgments or brief interactions
- Personalized and intimate tone

### 3. Selection Algorithm

The system uses a **deterministic, cryptographically secure** random selection algorithm:

- Uses Node.js `crypto.randomBytes()` for secure randomization
- Ensures even distribution across available responses
- Prevents predictable patterns
- Logs selection for audit purposes

## Data Model

### MoodBucket Schema

```typescript
{
  _id: ObjectId,
  name: string,              // e.g., "Happy", "Sad", "Angry", "Neutral"
  description: string,
  category: string,          // "public_gratitude" or "private_micro"
  responses: string[],       // Array of response templates
  isDefault: boolean,        // Whether this is a system default bucket
  visibility: string,        // "public" or "private"
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ModelMoodConfig Schema

```typescript
{
  _id: ObjectId,
  performerId: ObjectId,     // Reference to Performer
  enabledBuckets: ObjectId[], // Array of enabled MoodBucket IDs
  customResponses: {
    bucketId: ObjectId,
    responses: string[]      // Model's custom responses for this bucket
  }[],
  settings: {
    autoRespond: boolean,    // Enable/disable auto-responses
    responseDelay: number,   // Delay in seconds before auto-respond
    dailyLimit: number       // Max auto-responses per day
  },
  createdAt: Date,
  updatedAt: Date
}
```

### UserMessageHistory Schema (Optional - for analytics)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  performerId: ObjectId,
  bucketId: ObjectId,
  bucketName: string,
  responseUsed: string,
  context: {
    messageType: string,     // "tip", "gift", "message"
    amount: number           // If applicable (for tips)
  },
  timestamp: Date
}
```

## API Endpoints

### 1. Select Mood Response

**POST** `/api/mood-messaging/select`

Selects a random response from a specified mood bucket.

**Request Body:**
```json
{
  "bucketName": "happy",
  "performerId": "507f1f77bcf86cd799439011",
  "context": {
    "messageType": "tip",
    "amount": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "It's great to see you in high spirits! How can I assist you today?",
  "bucketId": "507f1f77bcf86cd799439012",
  "bucketName": "happy"
}
```

**Authentication:** Required (User or Performer)

**Authorization:** Public endpoint with rate limiting

### 2. Get Model Configuration

**GET** `/api/mood-messaging/model-config`

Retrieves the mood messaging configuration for the authenticated model.

**Response:**
```json
{
  "success": true,
  "config": {
    "performerId": "507f1f77bcf86cd799439011",
    "enabledBuckets": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "customResponses": [
      {
        "bucketId": "507f1f77bcf86cd799439012",
        "bucketName": "happy",
        "responses": [
          "Custom response 1",
          "Custom response 2"
        ]
      }
    ],
    "settings": {
      "autoRespond": true,
      "responseDelay": 2,
      "dailyLimit": 100
    }
  }
}
```

**Authentication:** Required (Performer only)

**Authorization:** Performer can only access their own configuration

### 3. Update Model Configuration

**PUT** `/api/mood-messaging/model-config`

Updates the mood messaging configuration for the authenticated model.

**Request Body:**
```json
{
  "enabledBuckets": ["507f1f77bcf86cd799439012"],
  "customResponses": [
    {
      "bucketId": "507f1f77bcf86cd799439012",
      "responses": ["New custom response 1", "New custom response 2"]
    }
  ],
  "settings": {
    "autoRespond": false,
    "responseDelay": 5,
    "dailyLimit": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "config": { /* updated config object */ }
}
```

**Authentication:** Required (Performer only)

**Authorization:** Performer can only update their own configuration

### 4. Restore Default Configuration

**POST** `/api/mood-messaging/restore-defaults`

Resets the model's configuration to system defaults.

**Response:**
```json
{
  "success": true,
  "message": "Configuration restored to defaults",
  "config": { /* default config object */ }
}
```

**Authentication:** Required (Performer only)

**Authorization:** Performer can only restore their own configuration

## Security & Privacy

### Security Requirements

1. **Authentication**: All endpoints require valid authentication tokens
2. **Authorization**: Models can only access/modify their own configurations
3. **Rate Limiting**: All endpoints have rate limits to prevent abuse
4. **Input Validation**: All inputs are validated and sanitized
5. **CSPRNG**: Use cryptographically secure random number generation
6. **Audit Logging**: All configuration changes are logged

### Privacy Requirements

1. **No PII in Responses**: Response templates must not contain personally identifiable information
2. **User Anonymization**: Message history does not store message content
3. **Data Minimization**: Only essential data is stored
4. **Access Control**: Strict access control on all sensitive data

### Prohibited Behaviors

❌ **Absolutely Prohibited:**
- Hardcoded "master" responses or backdoors
- Using `Math.random()` for response selection
- Logging user message content or PII
- Trusting client-provided performer IDs without verification
- Allowing unauthorized access to other models' configurations

✅ **Required:**
- Server-side validation of all inputs
- Cryptographically secure randomization (`crypto.randomBytes()`)
- Authentication verification on every request
- Authorization checks against authenticated user
- Rate limiting on all endpoints
- Audit trail for configuration changes

## Implementation Notes

### Response Selection Algorithm

```typescript
import * as crypto from 'crypto';

function selectResponse(responses: string[]): string {
  if (!responses || responses.length === 0) {
    throw new Error('No responses available');
  }
  
  // Use cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const index = randomNumber % responses.length;
  
  return responses[index];
}
```

### Database Indexes

```typescript
// MoodBucket indexes
MoodBucketSchema.index({ name: 1 });
MoodBucketSchema.index({ category: 1, active: 1 });

// ModelMoodConfig indexes
ModelMoodConfigSchema.index({ performerId: 1 }, { unique: true });

// UserMessageHistory indexes (if implemented)
UserMessageHistorySchema.index({ performerId: 1, timestamp: -1 });
UserMessageHistorySchema.index({ userId: 1, timestamp: -1 });
```

### Idempotency

All state-changing operations should support idempotency:
- Use unique constraint on `ModelMoodConfig.performerId`
- Use upsert operations where appropriate
- Include request IDs for tracking

## Testing Requirements

### Unit Tests

1. **Service Tests**
   - Test response selection algorithm
   - Test configuration retrieval
   - Test configuration updates
   - Test default restoration
   - Test edge cases (empty responses, invalid IDs)

2. **Controller Tests**
   - Test authentication enforcement
   - Test authorization checks
   - Test input validation
   - Test response formats

### Integration Tests

1. **Database Operations**
   - Test schema constraints
   - Test indexes
   - Test cascade operations

2. **API Flow Tests**
   - Test complete request/response cycles
   - Test error handling
   - Test rate limiting

### Security Tests

1. **Authentication Bypass Attempts**
   - Test endpoints without auth tokens
   - Test endpoints with invalid tokens

2. **Authorization Boundary Tests**
   - Test accessing other models' configurations
   - Test privilege escalation attempts

3. **Randomization Tests**
   - Verify CSPRNG usage
   - Test distribution of selections
   - Verify no predictable patterns

## Deployment

### Migration Process

1. Run database migration to create collections
2. Seed default mood buckets
3. Seed default responses
4. Create indexes
5. Validate data integrity

### Rollback Plan

- Migration includes `down()` function to reverse changes
- Backup existing data before migration
- Test rollback in staging environment

## Future Enhancements

- Machine learning for mood detection from user messages
- A/B testing framework for response effectiveness
- Analytics dashboard for models
- Multi-language support
- Dynamic response generation using LLMs
- User preference learning
