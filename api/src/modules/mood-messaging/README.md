# Model Mood Messaging Module

## Overview

The Model Mood Messaging Module provides an automated response system that enables models (performers) to send contextually appropriate pre-configured messages to users based on mood categories. The system helps models respond quickly while maintaining engagement and professionalism.

## Features

- **Predefined Mood Buckets**: Default categories (Happy, Sad, Angry, Neutral) with response templates
- **Gratitude Responses**: Public thank-you messages for tips, gifts, and follows
- **Custom Responses**: Models can customize responses for each mood bucket
- **Secure Randomization**: Uses cryptographically secure random selection (CSPRNG)
- **Configuration Management**: Models can enable/disable buckets and configure settings
- **Analytics**: Optional usage tracking for optimization (no PII)

## Architecture

### Schemas

#### MoodBucket
Stores predefined mood-based response templates.

```typescript
{
  name: string;              // e.g., "happy", "sad", "angry"
  description: string;
  category: string;          // "public_gratitude" or "private_micro"
  responses: string[];       // Array of response templates
  isDefault: boolean;        // System default bucket
  visibility: string;        // "public" or "private"
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ModelMoodConfig
Stores model-specific configuration.

```typescript
{
  performerId: ObjectId;     // Reference to Performer
  enabledBuckets: ObjectId[]; // Enabled mood buckets
  customResponses: {
    bucketId: ObjectId;
    responses: string[];
  }[];
  settings: {
    autoRespond: boolean;
    responseDelay: number;
    dailyLimit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### UserMessageHistory
Tracks usage for analytics (no PII stored).

```typescript
{
  userId: ObjectId;
  performerId: ObjectId;
  bucketId: ObjectId;
  bucketName: string;
  responseIndex: number;
  context: {
    messageType: string;
    amount?: number;
  };
  timestamp: Date;
}
```

## API Endpoints

### POST /api/mood-messaging/select

Selects a random response from a mood bucket.

**Authentication**: Required

**Request Body**:
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

**Response**:
```json
{
  "success": true,
  "response": "It's great to see you in high spirits! How can I assist you today?",
  "bucketId": "507f1f77bcf86cd799439012",
  "bucketName": "happy"
}
```

### GET /api/mood-messaging/model-config

Retrieves the model's mood messaging configuration.

**Authentication**: Required (Performer only)

**Response**:
```json
{
  "success": true,
  "config": {
    "performerId": "507f1f77bcf86cd799439011",
    "enabledBuckets": ["..."],
    "customResponses": [...],
    "settings": {
      "autoRespond": false,
      "responseDelay": 2,
      "dailyLimit": 100
    }
  }
}
```

### PUT /api/mood-messaging/model-config

Updates the model's configuration.

**Authentication**: Required (Performer only)

**Request Body**:
```json
{
  "enabledBuckets": ["507f1f77bcf86cd799439012"],
  "customResponses": [
    {
      "bucketId": "507f1f77bcf86cd799439012",
      "responses": ["Custom response 1", "Custom response 2"]
    }
  ],
  "settings": {
    "autoRespond": false,
    "responseDelay": 5,
    "dailyLimit": 50
  }
}
```

### POST /api/mood-messaging/restore-defaults

Resets the model's configuration to system defaults.

**Authentication**: Required (Performer only)

**Response**:
```json
{
  "success": true,
  "message": "Configuration restored to defaults",
  "config": {...}
}
```

## Security

### Requirements

- ✅ All endpoints require authentication
- ✅ Performer-only endpoints check user role
- ✅ CSPRNG used for response selection (`crypto.randomBytes()`)
- ✅ No PII stored in usage history
- ✅ Server-side validation of all inputs
- ✅ Authorization checks on all configuration endpoints

### Prohibited

- ❌ No hardcoded "master" responses or backdoors
- ❌ No use of `Math.random()` for selection
- ❌ No logging of user message content or PII
- ❌ No trusting client-provided performer IDs without verification

## Usage Examples

### Select a Response (User/Performer)

```typescript
import { MoodMessagingService } from './services';

// Inject service
constructor(private moodMessagingService: MoodMessagingService) {}

// Select response
const result = await this.moodMessagingService.selectMoodResponse(
  {
    bucketName: 'happy',
    context: {
      messageType: 'tip',
      amount: 100
    }
  },
  authenticatedUserId
);

console.log(result.response); // Random response from 'happy' bucket
```

### Update Model Configuration (Performer)

```typescript
const config = await this.moodMessagingService.updateModelConfig(
  performerId,
  {
    enabledBuckets: ['bucket-id-1', 'bucket-id-2'],
    customResponses: [
      {
        bucketId: 'bucket-id-1',
        responses: ['My custom response 1', 'My custom response 2']
      }
    ],
    settings: {
      autoRespond: true,
      responseDelay: 3,
      dailyLimit: 75
    }
  }
);
```

### Restore Defaults (Performer)

```typescript
const config = await this.moodMessagingService.restoreDefaults(performerId);
```

## Testing

Run the module tests:

```bash
cd api
yarn test mood-messaging
```

Run all tests:

```bash
cd api
yarn test
```

## Database Migration

The migration seeds default mood buckets into the database.

Run migrations:

```bash
cd api
yarn migrate
```

The migration is idempotent - it won't create duplicates if run multiple times.

## Default Mood Buckets

### Private Micro-Responses

1. **Happy** - Upbeat responses for cheerful users
2. **Sad** - Empathetic responses for users seeking comfort
3. **Angry** - Calming responses for frustrated users
4. **Neutral** - General-purpose casual responses

### Public Gratitude

1. **Tip Gratitude** - Thank you messages for tips
2. **Gift Gratitude** - Thank you messages for gifts
3. **General Gratitude** - General thank you messages
4. **New Follower Gratitude** - Welcome messages for new followers

## Configuration

### Default Settings

- `autoRespond`: `false` - Auto-response disabled by default
- `responseDelay`: `2` seconds - Delay before auto-respond
- `dailyLimit`: `100` - Maximum auto-responses per day

### Validation Limits

- `MAX_CUSTOM_RESPONSES_PER_BUCKET`: 50
- `MIN_CUSTOM_RESPONSES_PER_BUCKET`: 1
- `MAX_RESPONSE_LENGTH`: 500 characters
- `MIN_RESPONSE_LENGTH`: 1 character
- `responseDelay`: 0-60 seconds
- `dailyLimit`: 0-1000 responses

## Dependencies

- `@nestjs/common`
- `@nestjs/mongoose`
- `mongoose`
- `crypto` (Node.js built-in)

## Future Enhancements

- [ ] Machine learning for automated mood detection
- [ ] A/B testing framework for response effectiveness
- [ ] Real-time analytics dashboard
- [ ] Multi-language support
- [ ] Dynamic response generation using LLMs
- [ ] User preference learning
- [ ] Rate limiting per endpoint
- [ ] Webhook notifications for config changes

## Support

For issues or questions, see the main repository documentation or contact the development team.
