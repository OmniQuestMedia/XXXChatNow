# Model Mood Response System

## Architecture
<<<<<<< HEAD
The Model Mood Response System (MMRS) is built to adapt chatbot interactions based on user mood detection and contextual responsiveness. It integrates the following components:
=======
The Model Mood Response System (MMRS) is built to adapt chatbot interactions based on user mood detection and contextual responsiveness. It provides fully-trackable, deterministic message delivery with comprehensive audit trails for user-model interactions.

### Core Components
>>>>>>> copilot/implement-mood-messaging-system

1. **Mood Analysis Engine**:
   - Analyzes user inputs to classify emotional states (e.g., happy, sad, angry, neutral).
   - Utilizes pre-trained natural language processing (NLP) models for sentiment detection.
   - Continuously learns and adapts through user interaction feedback loops.

2. **Contextual Response Generator**:
   - Leverages mood data to generate adaptive responses appropriate to the situation.
   - Integrates with LLMs (Large Language Models) for advanced language generation.
   - Parameters customizable based on business or interaction goals.

3. **Template Repository**:
   - Stores a library of predefined message templates for different moods and contexts.
   - Includes fallback responses when mood analysis yields ambiguous results.
<<<<<<< HEAD

4. **Integration Framework**:
   - Flexible API layer enabling seamless integration with existing platforms and services.
   - Includes webhook support for user-triggered/manual overrides.

## Core Functionalities
- **Mood Detection:** Analyzes text inputs for mood indicators.
- **Message Adaptation:** Tailors chatbot responses to specific user emotions.
- **Data Collection:** Logs user feedback and anonymized interaction stats for ongoing system optimization.
- **Customizable Design:** Allows developers to expand mood-related templates and fine-tune classifier thresholds.
=======
   - Template versioning for A/B testing and optimization.

4. **Message Tracking Layer**:
   - **Fully-trackable message delivery system**
   - Complete audit trail for all mood-based messages
   - Delivery status tracking (pending, sent, delivered, read, failed)
   - User tier-based message prioritization
   - Asynchronous message queue for scalability
   - Real-time delivery monitoring

5. **Integration Framework**:
   - Flexible API layer enabling seamless integration with existing platforms and services.
   - Includes webhook support for user-triggered/manual overrides.
   - REST API endpoints for message management

## Core Functionalities

### Message Delivery & Tracking
- **Public Micro Responses**: Quick, automated responses for general interactions
- **Private Custom Messages**: Personalized messages for VIP/premium users
- **Delivery Tracking**: Real-time status monitoring for all messages
- **Queue Management**: Async delivery with priority-based routing
- **User Tier Integration**: Different message types and priorities based on user tier
- **Audit Trail**: Complete logging of all message interactions

### Mood Detection & Adaptation
- **Mood Detection**: Analyzes text inputs for mood indicators
- **Message Adaptation**: Tailors chatbot responses to specific user emotions
- **Context Awareness**: Considers conversation history and user preferences
- **Data Collection**: Logs user feedback and anonymized interaction stats for ongoing system optimization
- **Customizable Design**: Allows developers to expand mood-related templates and fine-tune classifier thresholds

### Security & Compliance
- **Authentication Required**: All message endpoints require valid authentication
- **Authorization Checks**: Verify user has permission to receive specific message types
- **Rate Limiting**: Prevent spam and abuse
- **Content Moderation**: Filter inappropriate content
- **Audit Logging**: Complete record of all message operations

## Message Types & Tiers

### Public Micro Responses
**Target**: All users
**Characteristics**:
- Quick, automated responses
- General mood-based messages
- Low latency delivery
- Template-based responses

**Examples**:
- Welcome messages
- Quick acknowledgments
- General mood responses
- Public announcements

### Private Custom Messages
**Target**: Premium users, VIP tier, subscribers
**Characteristics**:
- Personalized content
- Higher priority delivery
- Custom message generation
- Extended length and multimedia support

**Examples**:
- Personalized greetings
- Custom mood-based responses
- VIP-exclusive content
- One-on-one conversation messages

### Escalation Automated Messages
**Target**: Based on user behavior triggers
**Characteristics**:
- Context-aware responses
- Multi-step conversation flows
- Conditional logic based on user state
- Automatic escalation to human moderators if needed

**Examples**:
- Angry mood de-escalation sequences
- Sad mood support sequences
- Engagement re-activation sequences
- Churn prevention messages

## User Tier-Based Message Routing

### Tier Configuration

| Tier | Message Priority | Delivery Speed | Custom Messages | Mood Analysis Depth |
|------|-----------------|----------------|-----------------|---------------------|
| Free | Low | Standard | No | Basic |
| Basic | Normal | Standard | Limited | Standard |
| Premium | High | Fast | Yes | Advanced |
| VIP | Critical | Immediate | Unlimited | Deep Analysis |

### Priority Queue System
- **Critical**: VIP user messages (immediate delivery)
- **High**: Premium user messages (< 1 second)
- **Normal**: Basic user messages (< 5 seconds)
- **Low**: Free user messages (< 30 seconds)

## Message Schema

### MoodMessage Document

```typescript
{
  message_id: string,           // Unique identifier
  user_id: ObjectId,            // Recipient user
  model_id: ObjectId,           // Sending model (if applicable)
  message_type: string,         // 'public_micro', 'private_custom', 'escalation_auto'
  detected_mood: string,        // 'happy', 'sad', 'angry', 'neutral', 'excited', 'anxious'
  mood_confidence: number,      // 0-100 confidence score
  template_id?: string,         // Template used (if applicable)
  content: string,              // Message content
  metadata: object,             // Additional context
  user_tier: string,            // User tier at time of message
  priority: number,             // Delivery priority (1-10)
  status: string,               // 'pending', 'sent', 'delivered', 'read', 'failed'
  sent_at?: Date,               // When message was sent
  delivered_at?: Date,          // When message was delivered
  read_at?: Date,               // When message was read
  failed_at?: Date,             // When delivery failed
  failure_reason?: string,      // Reason for failure
  retry_count: number,          // Number of retry attempts
  created_at: Date,             // Creation timestamp
  updated_at: Date              // Last update timestamp
}
```

## API Endpoints

### Message Delivery

#### POST /api/mood-message/send
Send a mood-based message to a user.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "message_type": "private_custom",
  "content": "I noticed you seem happy today! That's wonderful!",
  "detected_mood": "happy",
  "mood_confidence": 87,
  "priority": 8
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "uuid-v4",
  "status": "pending",
  "estimated_delivery_seconds": 1
}
```

#### GET /api/mood-message/:messageId/status
Get delivery status of a message.

**Response:**
```json
{
  "message_id": "uuid-v4",
  "status": "delivered",
  "sent_at": "2026-01-02T18:45:00Z",
  "delivered_at": "2026-01-02T18:45:01Z",
  "read_at": null
}
```

#### GET /api/mood-message/history
Get message history for authenticated user.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)
- `message_type` (optional filter)
- `mood` (optional filter)

### Analytics & Monitoring

#### GET /api/mood-message/analytics
Get mood message analytics (admin only).

**Response:**
```json
{
  "total_messages": 10000,
  "by_mood": {
    "happy": 4500,
    "sad": 2000,
    "angry": 1000,
    "neutral": 2500
  },
  "by_tier": {
    "vip": 1000,
    "premium": 3000,
    "basic": 4000,
    "free": 2000
  },
  "delivery_success_rate": 98.5,
  "average_delivery_time_ms": 850
}
```
>>>>>>> copilot/implement-mood-messaging-system

## Sample Messaging Templates

### Happy Mood
- "It's great to see you in high spirits! How can I assist you today?"
- "Awesome! Let's make this an even better day for you. What's on your mind?"
<<<<<<< HEAD
=======
- "Your positive energy is contagious! 😊 What would you like to do?"
>>>>>>> copilot/implement-mood-messaging-system

### Sad Mood
- "I'm here to help. Let me know what I can do for you."
- "I'm sorry you're feeling this way. How can I assist?"
<<<<<<< HEAD
=======
- "I'm here to listen. Would you like to talk about it?"
>>>>>>> copilot/implement-mood-messaging-system

### Angry Mood
- "It sounds like something's on your mind. I'm here to listen—let me know what's bothering you."
- "I'm here to make things better. How can I assist?"
<<<<<<< HEAD
=======
- "I understand you're frustrated. Let's work together to resolve this."

### Excited Mood
- "Your excitement is wonderful! What's got you feeling so energized?"
- "That's amazing! Tell me more!"
- "I love your enthusiasm! How can I help make today even better?"

### Anxious Mood
- "I'm here to support you. Let's take this one step at a time."
- "It's okay to feel uncertain. How can I help ease your concerns?"
- "You're not alone. I'm here to help you through this."
>>>>>>> copilot/implement-mood-messaging-system

### Neutral/Unsure Mood
- "What would you like to talk about today?"
- "How can I assist you right now?"
<<<<<<< HEAD

---

This document serves as the foundational description of the MMRS system.
=======
- "I'm here whenever you need me. What's on your mind?"

## Async Delivery System

### Message Queue Architecture

```
User Sends Message
    ↓
Mood Detection (< 100ms)
    ↓
Priority Assignment (Based on User Tier)
    ↓
Message Queue (Redis-backed)
    ↓
├─→ Critical Priority (VIP): Immediate Processing
├─→ High Priority (Premium): < 1s Processing
├─→ Normal Priority (Basic): < 5s Processing
└─→ Low Priority (Free): < 30s Processing
    ↓
Message Delivery
    ↓
Status Tracking & Audit Log
```

### Delivery Guarantees
- **At-least-once delivery**: Messages are guaranteed to be delivered at least once
- **Retry mechanism**: Failed deliveries are automatically retried (max 3 attempts)
- **Dead Letter Queue**: Permanently failed messages are moved to DLQ for manual review
- **Delivery confirmation**: Real-time status updates via WebSocket

## Integration with Existing Systems

### Message Module Integration
- Leverages existing message infrastructure
- Extends with mood detection and tracking
- Shares notification channels

### User Module Integration
- Reads user tier information
- Checks user preferences and settings
- Respects user notification preferences

### Notification Module Integration
- Uses notification system for delivery
- WebSocket real-time updates
- Push notification support

## Security Requirements

### Authentication & Authorization
✅ **Authentication Required**: All endpoints require valid JWT tokens
✅ **Authorization Checks**: Users can only access their own messages
✅ **Admin Endpoints**: Protected by role-based access control

### Rate Limiting
✅ **Per-User Limits**: Prevent spam and abuse
✅ **Per-Model Limits**: Prevent system overload
✅ **Tier-Based Limits**: Different limits for different user tiers

### Data Privacy
✅ **PII Protection**: No sensitive data in logs
✅ **Anonymized Analytics**: User-identifiable data removed from analytics
✅ **Consent-Based**: Respect user privacy preferences

### Audit Trail
✅ **Complete Logging**: All message operations logged
✅ **Immutable Records**: Audit logs cannot be modified
✅ **Retention Policy**: Logs retained per compliance requirements

## Testing Requirements

### Unit Tests
- Mood detection accuracy
- Template selection logic
- Priority assignment
- Delivery status tracking

### Integration Tests
- End-to-end message delivery
- Queue processing
- Retry mechanism
- Multi-tier message routing

### Performance Tests
- Message throughput (target: 10,000 msg/sec)
- Latency by priority tier
- Queue processing efficiency
- Database query performance

---

**References**:
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md` - Security requirements
- `COPILOT_GOVERNANCE.md` - Governance standards
- `PERFORMANCE_QUEUE_ARCHITECTURE.md` - Queue system architecture

**Last Updated**: 2026-01-02
**Version**: 2.0.0
>>>>>>> copilot/implement-mood-messaging-system
