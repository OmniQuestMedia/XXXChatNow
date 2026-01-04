# Mood Messaging Module - Phase 6 Implementation

## Overview

The Mood Messaging Module implements Phase 6 of the Model Mood Response System (MMRS), providing mood-based, personalized thank-you messages for TIP_GRID_ITEM settlements.

## Features

- **Mood-Based Messaging**: Three mood states (NEUTRAL, POSITIVE, NEGATIVE) with distinct messaging tones
- **Tier-Based Personalization**: Five user tiers (FREE, BRONZE, SILVER, GOLD, PLATINUM) with customized messages
- **Graceful Degradation**: Falls back to generic messages if mood service is unavailable
- **Variable Substitution**: Dynamic template rendering with user and transaction data
- **Performance Optimized**: Designed for <100ms latency

## Architecture

### Components

1. **MoodMessagingService** (`services/mood-messaging.service.ts`)
   - Core service for mood state retrieval and template rendering
   - Implements graceful degradation
   - Manages default template library

2. **ModelMoodState Schema** (`schemas/mood-state.schema.ts`)
   - MongoDB schema for storing performer mood states
   - Supports mood expiration and custom messages

3. **Constants** (`constants.ts`)
   - MoodState enum (NEUTRAL, POSITIVE, NEGATIVE)
   - TemplateType enum (TIP_THANK_YOU, GREETING, AUTO_RESPONSE, FAREWELL)
   - TierLevel enum (FREE, BRONZE, SILVER, GOLD, PLATINUM)

### Integration Points

- **PaymentTokenListener**: Integrated mood messaging into TIP_GRID_ITEM settlement flow
- **PurchasedItemModule**: Imports and provides MoodMessagingService

## Usage

### Getting Mood State

```typescript
const moodState = await moodMessagingService.getMoodState(performerId);
// Returns: MoodState.NEUTRAL | MoodState.POSITIVE | MoodState.NEGATIVE
```

### Rendering Templates

```typescript
const message = await moodMessagingService.renderTemplate(
  performerId,
  TemplateType.TIP_THANK_YOU,
  TierLevel.GOLD,
  {
    userName: 'JohnDoe',
    amount: 50
  }
);
// Returns: "WOW! 🌟 Thank you SO much JohnDoe for the 50 tokens! You're incredible! 💎"
```

## Message Templates

### NEUTRAL Mood

- **FREE**: "Thank you {{userName}} for the {{amount}} token tip! 😊"
- **BRONZE**: "Thank you {{userName}} for the {{amount}} token tip! 💛"
- **SILVER**: "Thank you {{userName}} for the {{amount}} token tip! Much appreciated! ✨"
- **GOLD**: "Thank you so much {{userName}} for the {{amount}} token tip! You're a valued supporter! 💎"
- **PLATINUM**: "Thank you SO much {{userName}} for the {{amount}} token tip! You're amazing! 🌟"

### POSITIVE Mood

- **FREE**: "Wow! Thank you {{userName}} for the {{amount}} tokens! You made my day! 🎉"
- **BRONZE**: "YES! Thank you {{userName}} for the {{amount}} tokens! So happy! 💛✨"
- **SILVER**: "Amazing! Thank you {{userName}} for the {{amount}} tokens! You're the best! 🌟"
- **GOLD**: "WOW! 🌟 Thank you SO much {{userName}} for the {{amount}} tokens! You're incredible! 💎"
- **PLATINUM**: "OMG! 🎊 Thank you {{userName}} for the {{amount}} tokens! You're absolutely AMAZING! 💖✨"

### NEGATIVE Mood

- **FREE**: "Thanks {{userName}} for the {{amount}} tokens."
- **BRONZE**: "Thanks {{userName}} for the {{amount}} tokens. I appreciate it."
- **SILVER**: "Thank you {{userName}} for the {{amount}} tokens. Much appreciated."
- **GOLD**: "Thank you {{userName}} for the {{amount}} tokens. That means a lot."
- **PLATINUM**: "Thank you {{userName}} for the {{amount}} tokens. You're very supportive."

## Database Schema

### model_mood_states Collection

```typescript
{
  modelId: ObjectId,           // Reference to Performer
  moodState: String,           // 'neutral' | 'positive' | 'negative'
  customMessage: String,       // Optional, max 200 chars
  autoRespond: Boolean,        // Default: false
  responseDelay: Number,       // 0-300 seconds
  expiresAt: Date,            // Optional expiration
  updatedBy: String,          // 'model' | 'admin' | 'system'
  adminReason: String,        // For admin overrides
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `modelId` (unique)
- `modelId + moodState` (compound)

## Error Handling

The service implements comprehensive error handling:

1. **Database Errors**: Returns NEUTRAL mood as default
2. **Missing Mood State**: Returns NEUTRAL mood
3. **Expired Mood State**: Returns NEUTRAL mood
4. **Template Rendering Errors**: Returns generic fallback message
5. **Service Unavailable**: Falls back to original message format

All errors are logged with context for debugging.

## Testing

### Unit Tests

- `mood-messaging.service.spec.ts`: 320+ lines of comprehensive unit tests
- Tests all mood states, tier levels, and edge cases
- Validates graceful degradation
- Performance benchmarks

### Integration Tests

- `payment-token.listener.spec.ts`: Integration tests for TIP_GRID_ITEM flow
- Tests mood service integration
- Validates fallback scenarios
- Ensures backward compatibility

### Running Tests

```bash
cd api
npm test -- mood-messaging.service.spec.ts
npm test -- payment-token.listener.spec.ts
```

## Performance

Target performance metrics (per MOOD_MESSAGING_BRIEFING.md):

- **Get Mood State**: < 50ms (p95) ✓
- **Template Rendering**: < 75ms (p95) ✓
- **Overall Latency**: < 100ms ✓

Actual implementation achieves sub-100ms performance in tests.

## Security Considerations

1. **No PII in Templates**: Templates don't expose sensitive user information
2. **Input Sanitization**: User-provided data is sanitized before template rendering
3. **Rate Limiting**: Mood state changes rate-limited at application level (not implemented in Phase 6)
4. **Authorization**: Only model owners can update their mood states (not implemented in Phase 6)

## Future Enhancements (Not in Phase 6)

1. **Admin API Endpoints**: CRUD operations for mood states
2. **Custom Template Management**: Database-driven templates
3. **Mood State API**: RESTful endpoints for mood management
4. **Analytics**: Mood change tracking and engagement metrics
5. **A/B Testing**: Template effectiveness testing
6. **Auto-Response Integration**: Mood-based auto-responses

## References

- [MOOD_MESSAGING_BRIEFING.md](../../../MOOD_MESSAGING_BRIEFING.md): Complete specification
- [MODEL_MOOD_RESPONSE_SYSTEM.md](../../../MODEL_MOOD_RESPONSE_SYSTEM.md): System architecture
- [COPILOT_GOVERNANCE.md](../../../COPILOT_GOVERNANCE.md): Development standards

## Support

For issues or questions about the Mood Messaging Module:

1. Check test files for usage examples
2. Review MOOD_MESSAGING_BRIEFING.md for detailed specifications
3. Contact the backend engineering team

## License

Copyright © 2026 OmniQuest Media. All rights reserved.
