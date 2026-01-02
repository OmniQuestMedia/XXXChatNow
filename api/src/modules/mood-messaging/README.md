# Mood Messaging System

## Overview

The Mood Messaging System (MMS) is a sophisticated messaging feature that delivers personalized, tier-based, and non-repetitive messages to users. It includes both private mood messages and public micro-gratitude responses.

## Features

### 1. Private Mood Messages
- **Tier-based bucket assignment**: Different membership tiers have access to different mood buckets
- **Dynamic placeholder substitution**: All messages use `<user>` placeholder that gets replaced with actual username at runtime
- **Non-repetitive selection**: Messages won't repeat within the user's interaction cycle
- **8 mood buckets**: Cute, Flirty, Spicy, Bratty, Dominant, Playful, Soft Sell, Secondary Micro

### 2. Public Micro-Gratitude
- **24 unique responses**: Variety of short, friendly gratitude messages
- **Applies to all tiers**: Every user can receive these messages
- **5-message non-repetition cycle**: Ensures no message repeats within the last 5 uses per user

### 3. Tier-to-Bucket Mapping
The system defines default tier-to-bucket mappings:

| Tier | Available Buckets | Secondary Micro Access |
|------|------------------|------------------------|
| Guest | Soft Sell | No |
| VIP Guest | Soft Sell, Cute, Flirty | No |
| Silver VIP | Flirty, Playful, Cute | No |
| Gold VIP | Flirty, Playful, Bratty, Spicy | Yes |
| Platinum VIP | Playful, Bratty, Spicy, Dominant | Yes |
| Diamond VIP | All buckets | Yes |

## API Endpoints

### Get Private Mood Message
```
GET /mood-messaging/private-mood?tierKey=gold_vip&username=JohnDoe
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Hey JohnDoe! You're adorable 🥰"
}
```

### Get Public Gratitude Message
```
GET /mood-messaging/public-gratitude
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Thanks babe 😘"
}
```

### Get Available Buckets
```
GET /mood-messaging/available-buckets?tierKey=gold_vip
Authorization: Bearer <token>
```

**Response:**
```json
{
  "buckets": ["flirty", "playful", "bratty", "spicy"],
  "hasSecondaryMicro": true
}
```

## Database Collections

### mood_buckets
Stores all mood bucket definitions with their responses.

```javascript
{
  key: 'cute',
  name: 'Cute',
  description: 'Sweet and endearing messages',
  responses: [
    'Hey <user>! You\'re adorable 🥰',
    // ... 7 more responses
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### tier_bucket_mappings
Defines which buckets are available for each tier.

```javascript
{
  tierKey: 'gold_vip',
  tierName: 'Gold VIP',
  description: 'Gold tier membership with secondary micro access',
  buckets: ['flirty', 'playful', 'bratty', 'spicy'],
  hasSecondaryMicro: true,
  createdAt: Date,
  updatedAt: Date
}
```

### public_micro_gratitude
Contains all public gratitude message options.

```javascript
{
  responseId: 0,
  text: 'Thanks babe 😘',
  createdAt: Date,
  updatedAt: Date
}
```

### mood_message_history
Tracks message usage history for non-repetitive selection.

```javascript
{
  userId: ObjectId,
  messageType: 'private_mood' | 'public_micro_gratitude',
  bucketKey: 'cute',
  usedResponseIndices: [0, 2, 5],
  cycleCount: 3,
  lastUsedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Seed Data

All seed data is located in `/api/seeds/mood-messaging/`:

- **mood-buckets.json**: All mood bucket definitions with 8 responses each
- **public-micro-gratitude.json**: 24 public gratitude messages
- **tier-to-bucket-mapping.json**: Default tier-to-bucket assignments

## Migration

To seed the database with initial data, run:

```bash
yarn migrate up 1735845000000-mood-messaging-seed
```

This will:
1. Load all mood buckets into the database
2. Load all public micro-gratitude messages
3. Load all tier-to-bucket mappings

## Non-Repetition Logic

The system ensures messages don't repeat within 5 consecutive uses per user:

1. When a message is requested, the system checks the user's message history
2. It identifies which responses have been used in the last 5 requests
3. It randomly selects from the unused responses
4. If all responses have been used, it resets and allows any response
5. The selected index is added to the history (keeping only last 5)

## Security Considerations

- ✅ All endpoints require authentication (JWT)
- ✅ User IDs are taken from authenticated session, not client input
- ✅ No sensitive data is logged
- ✅ All database queries use parameterized inputs
- ✅ Placeholder substitution is safe (no code execution)

## Testing

Run the test suite:

```bash
yarn test mood-messaging.service.spec.ts
```

Test coverage includes:
- Private mood message generation
- Public gratitude message generation
- Non-repetitive selection logic
- Tier-based bucket filtering
- Fallback behavior for invalid tiers
- Secondary micro access checks

## Integration

The Mood Messaging Module is registered in `app.module.ts`:

```typescript
import { MoodMessagingModule } from './modules/mood-messaging/mood-messaging.module';

@Module({
  imports: [
    // ... other modules
    MoodMessagingModule
  ]
})
export class AppModule { }
```

## Future Enhancements

Possible future improvements:
- Admin interface to manage mood buckets
- A/B testing for different message variations
- Analytics on message engagement
- Custom tier configurations per performer
- Machine learning-based mood detection
- Multi-language support
- Time-based message scheduling

## Support

For questions or issues, refer to the main project documentation or contact the development team.
