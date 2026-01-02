# XXXChatNow Model Mood Messaging System - Official Briefing v1

## Executive Summary

This document serves as the authoritative specification and implementation contract for the XXXChatNow Model Mood Messaging System. This briefing **must be reviewed and merged before any scaffold or implementation work begins**. All implementation work must strictly adhere to the requirements, boundaries, and acceptance criteria defined in this document.

## Purpose

The Model Mood Messaging System enhances user engagement by enabling dynamic, mood-based messaging between models and users. This feature allows models to set their current mood state, which influences messaging templates, auto-responses, and personalized interactions. The system creates a more immersive and responsive experience by tying emotional context to communication patterns.

## Ownership and Boundaries

### Feature Ownership
- **Product Owner**: Platform Product Team
- **Technical Owner**: Backend Engineering Team
- **Security Review**: Security Engineering Team
- **Compliance Review**: Legal & Compliance Team

### Scope Boundaries

**In Scope:**
- Model mood state management (create, update, query)
- Mood-based messaging template system
- Dynamic response generation based on mood states
- Mood state transition tracking and auditing
- Integration with existing messaging infrastructure
- User tier-based personalization rules
- API endpoints for mood management
- Analytics and reporting for mood engagement

**Out of Scope:**
- Modifications to core authentication system
- Changes to payment processing infrastructure
- AI-generated mood detection from user messages (future enhancement)
- Video call mood integration (separate feature)
- Modifications to existing user messaging quotas
- Changes to RedRoomRewards payment system

### System Boundaries
- **Frontend**: Model dashboard mood selector, user interface mood indicators
- **Backend**: Mood service API, messaging template engine, state management
- **Database**: Mood states table, mood transitions audit log, messaging templates
- **External Dependencies**: Message Service (integration), User Service (read-only), Performer Service (read-only)

## Security Requirements

### Authentication and Authorization
1. **Model Authentication**: All mood management operations require valid authenticated model session
2. **Authorization**: Models can only manage their own mood states
3. **Session Validation**: Validate user/model session tokens on every API request
4. **Read Access**: Users can view model mood states (public information)
5. **Write Access**: Only models can update their own mood states
6. **Admin Override**: Admin users can manage any model's mood state with audit trail

### Data Security
1. **Encryption in Transit**: All API communications must use TLS 1.3
2. **Encryption at Rest**: Mood transition audit logs encrypted using AES-256
3. **PII Protection**: NO personally identifiable information in mood templates or logs
4. **Secure State Management**: Mood state changes validated server-side only
5. **Template Security**: User-provided content in messages must be sanitized (XSS prevention)

### Access Control
1. **Public Access**: Mood states are public information (any authenticated user can view)
2. **Write Restrictions**: Only model owners can update their mood
3. **Template Access**: Messaging templates are read-only for users, configurable by admin
4. **Audit Trail**: Complete logging of all mood state changes with user ID and timestamp
5. **Rate Limiting**: Maximum 50 mood changes per model per hour (prevent abuse)

### Data Integrity
1. **Atomic Updates**: Mood state changes are atomic operations
2. **Validation**: All mood states must be valid enum values
3. **Consistency**: No partial state updates allowed
4. **Audit Immutability**: Mood transition logs are immutable (append-only)
5. **State Verification**: Server validates all state transitions

### Compliance
1. **Data Privacy**: Mood data is non-sensitive, public information
2. **Audit Requirements**: Complete audit trail for analytics and compliance
3. **Terms of Service**: Models must accept mood messaging terms before first use
4. **Content Moderation**: Templates must comply with platform content policies

## Performance Targets

### Latency Requirements
- **Get Mood State**: < 50ms (p95)
- **Update Mood State**: < 100ms (p95)
- **Get Messaging Template**: < 75ms (p95)
- **Mood History Query**: < 200ms (p95)

### Throughput Requirements
- **Concurrent Requests**: Support 5,000 concurrent mood queries
- **Updates per Second**: Handle 500 mood updates per second system-wide
- **Peak Load**: Handle 3x normal load during peak hours

### Availability Requirements
- **Uptime SLA**: 99.9% availability
- **Graceful Degradation**: If mood service unavailable, use default/neutral templates
- **Data Consistency**: Strong consistency for mood state updates, eventual consistency acceptable for analytics

### Scalability
- **Horizontal Scaling**: Service must scale horizontally to handle increased load
- **Database Optimization**: Proper indexing for fast mood state queries
- **Caching Strategy**: Cache current mood states with 5-minute TTL

## Model Configuration Rules

### Mood States

The system supports three primary mood states:

```typescript
enum MoodState {
  NEUTRAL = 'neutral',
  POSITIVE = 'positive', 
  NEGATIVE = 'negative'
}
```

**Mood State Definitions:**

1. **NEUTRAL** (Default)
   - Professional, balanced tone
   - Standard messaging templates
   - Default state for new models
   - Fallback when mood service unavailable

2. **POSITIVE**
   - Upbeat, energetic tone
   - Encouraging messaging
   - Emphasizes excitement and engagement

3. **NEGATIVE**
   - Serious, focused tone
   - Brief, direct messaging
   - Used when model needs space or has concerns

### Mood Metadata

Each mood state includes optional metadata:

```typescript
interface MoodMetadata {
  customMessage?: string;      // Optional model-specific message (max 200 chars)
  autoRespond?: boolean;        // Enable/disable auto-responses
  responseDelay?: number;       // Response delay in seconds (0-300)
  expiresAt?: Date;            // Optional auto-reset time
}
```

### State Transition Rules

1. **Validation**: Only valid enum values accepted
2. **Rate Limiting**: Maximum 50 mood changes per hour per model
3. **History Tracking**: All transitions logged for analytics
4. **Expiration**: Moods can auto-expire and reset to NEUTRAL
5. **Admin Override**: Admins can force mood state with reason logged

### Messaging Templates Configuration

Templates are defined per mood state:

```typescript
interface MoodTemplate {
  moodState: MoodState;
  templateType: 'greeting' | 'farewell' | 'auto_response' | 'tip_thank_you';
  tierLevel?: 'free' | 'bronze' | 'silver' | 'gold' | 'platinum';  // Optional user tier
  content: string;              // Template with {{variables}}
  priority: number;             // Higher priority templates used first
  active: boolean;
}
```

**Example Templates:**

```typescript
// Positive mood - greeting
{
  moodState: 'positive',
  templateType: 'greeting',
  content: "Hey there! 😊 I'm so happy to chat with you!",
  priority: 100,
  active: true
}

// Negative mood - auto_response
{
  moodState: 'negative',
  templateType: 'auto_response',
  content: "Thanks for your message. I'll respond when I can.",
  priority: 100,
  active: true
}

// Neutral mood - tip_thank_you (Gold tier)
{
  moodState: 'neutral',
  templateType: 'tip_thank_you',
  tierLevel: 'gold',
  content: "Thank you so much {{userName}} for the {{amount}} tip! You're a valued supporter! 💎",
  priority: 100,
  active: true
}
```

### Template Variables

Supported template variables:
- `{{userName}}` - User's display name
- `{{modelName}}` - Model's display name
- `{{amount}}` - Tip/payment amount
- `{{mood}}` - Current mood state
- `{{tier}}` - User tier level
- `{{customMessage}}` - Model's custom mood message

### Configuration Management
1. **Hot Configuration**: Templates can be added/updated without deployment
2. **Version Control**: All template changes versioned and auditable
3. **A/B Testing**: Support for testing different templates (future)
4. **Admin Interface**: Admin panel for template management
5. **Rollback**: Ability to revert to previous template versions

## Mood Service API Contract

### API Endpoints

#### Get Model Mood State
```
GET /api/v1/mood/{modelId}

Headers:
  Authorization: Bearer <token>

Response 200:
{
  "modelId": "string",
  "moodState": "neutral" | "positive" | "negative",
  "customMessage": "string" | null,
  "autoRespond": boolean,
  "responseDelay": number,
  "expiresAt": "ISO8601 timestamp" | null,
  "lastUpdated": "ISO8601 timestamp",
  "updatedBy": "model" | "admin"
}
```

#### Update Model Mood State (Model Only)
```
POST /api/v1/mood/update

Headers:
  Authorization: Bearer <token>

Body:
{
  "moodState": "neutral" | "positive" | "negative",
  "customMessage": "string (max 200 chars)" | null,
  "autoRespond": boolean,
  "responseDelay": number (0-300),
  "expiresAt": "ISO8601 timestamp" | null
}

Response 200:
{
  "modelId": "string",
  "moodState": "neutral" | "positive" | "negative",
  "customMessage": "string" | null,
  "autoRespond": boolean,
  "responseDelay": number,
  "expiresAt": "ISO8601 timestamp" | null,
  "lastUpdated": "ISO8601 timestamp",
  "updatedBy": "model"
}

Response 400:
{
  "error": "INVALID_MOOD_STATE" | "INVALID_CUSTOM_MESSAGE" | "INVALID_RESPONSE_DELAY",
  "message": "string"
}

Response 429:
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Maximum 50 mood changes per hour exceeded",
  "resetTime": "ISO8601 timestamp"
}
```

#### Get Mood History
```
GET /api/v1/mood/{modelId}/history?limit=20&offset=0

Headers:
  Authorization: Bearer <token>

Response 200:
{
  "history": [
    {
      "moodState": "positive",
      "changedAt": "ISO8601 timestamp",
      "changedBy": "model" | "admin",
      "previousState": "neutral",
      "customMessage": "string" | null
    }
  ],
  "total": number,
  "limit": number,
  "offset": number
}
```

#### Get Messaging Template
```
GET /api/v1/mood/template?modelId={modelId}&templateType={type}&userTier={tier}

Headers:
  Authorization: Bearer <token>

Query Parameters:
  - modelId: string (required)
  - templateType: 'greeting' | 'farewell' | 'auto_response' | 'tip_thank_you' (required)
  - userTier: 'free' | 'bronze' | 'silver' | 'gold' | 'platinum' (optional)

Response 200:
{
  "template": "string with {{variables}}",
  "moodState": "neutral" | "positive" | "negative",
  "variables": ["userName", "modelName", "amount", ...]
}

Response 404:
{
  "error": "TEMPLATE_NOT_FOUND",
  "message": "No template found for the specified criteria"
}
```

#### Render Messaging Template (Internal Service)
```
POST /api/v1/mood/template/render

Headers:
  Authorization: Bearer <token>

Body:
{
  "modelId": "string",
  "templateType": "greeting" | "farewell" | "auto_response" | "tip_thank_you",
  "userTier": "free" | "bronze" | "silver" | "gold" | "platinum",
  "variables": {
    "userName": "string",
    "amount": "number",
    ...
  }
}

Response 200:
{
  "renderedMessage": "string (processed template with variables replaced)",
  "moodState": "neutral" | "positive" | "negative"
}
```

### Admin API Endpoints

#### Force Update Model Mood (Admin Only)
```
POST /api/v1/admin/mood/{modelId}/update

Headers:
  Authorization: Bearer <admin-token>

Body:
{
  "moodState": "neutral" | "positive" | "negative",
  "reason": "string (required for audit)",
  "customMessage": "string" | null,
  "autoRespond": boolean,
  "expiresAt": "ISO8601 timestamp" | null
}

Response 200:
{
  "modelId": "string",
  "moodState": "neutral" | "positive" | "negative",
  "lastUpdated": "ISO8601 timestamp",
  "updatedBy": "admin",
  "adminReason": "string"
}
```

#### Create/Update Messaging Template (Admin Only)
```
POST /api/v1/admin/mood/template

Headers:
  Authorization: Bearer <admin-token>

Body:
{
  "moodState": "neutral" | "positive" | "negative",
  "templateType": "greeting" | "farewell" | "auto_response" | "tip_thank_you",
  "tierLevel": "free" | "bronze" | "silver" | "gold" | "platinum" | null,
  "content": "string with {{variables}}",
  "priority": number,
  "active": boolean
}

Response 200:
{
  "id": "string",
  "moodState": "string",
  "templateType": "string",
  "tierLevel": "string" | null,
  "content": "string",
  "priority": number,
  "active": boolean,
  "createdAt": "ISO8601 timestamp",
  "createdBy": "string"
}
```

#### Get All Templates (Admin Only)
```
GET /api/v1/admin/mood/templates?moodState={state}&active={boolean}

Headers:
  Authorization: Bearer <admin-token>

Response 200:
{
  "templates": [
    {
      "id": "string",
      "moodState": "string",
      "templateType": "string",
      "tierLevel": "string" | null,
      "content": "string",
      "priority": number,
      "active": boolean,
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ],
  "total": number
}
```

### Error Handling
- `INVALID_MOOD_STATE`: Mood state not one of the valid enum values
- `INVALID_CUSTOM_MESSAGE`: Custom message exceeds 200 characters or contains prohibited content
- `INVALID_RESPONSE_DELAY`: Response delay outside 0-300 second range
- `RATE_LIMIT_EXCEEDED`: Model has exceeded 50 mood changes per hour
- `UNAUTHORIZED`: User does not have permission to update mood
- `MODEL_NOT_FOUND`: Model ID does not exist
- `TEMPLATE_NOT_FOUND`: No matching template found for criteria
- `SYSTEM_ERROR`: Internal system error, operation not completed

## Data Models

### Model Mood State Schema
```sql
CREATE TABLE model_mood_states (
  id UUID PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  mood_state VARCHAR(20) NOT NULL CHECK (mood_state IN ('neutral', 'positive', 'negative')),
  custom_message VARCHAR(200),
  auto_respond BOOLEAN NOT NULL DEFAULT false,
  response_delay INTEGER NOT NULL DEFAULT 0 CHECK (response_delay >= 0 AND response_delay <= 300),
  expires_at TIMESTAMP,
  updated_by VARCHAR(20) NOT NULL CHECK (updated_by IN ('model', 'admin')),
  admin_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(model_id),
  INDEX idx_model_mood (model_id, mood_state),
  INDEX idx_updated_at (updated_at DESC)
);
```

### Mood Transition Audit Log Schema
```sql
CREATE TABLE mood_transition_logs (
  id UUID PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  previous_state VARCHAR(20) CHECK (previous_state IN ('neutral', 'positive', 'negative')),
  new_state VARCHAR(20) NOT NULL CHECK (new_state IN ('neutral', 'positive', 'negative')),
  changed_by VARCHAR(20) NOT NULL CHECK (changed_by IN ('model', 'admin', 'system')),
  admin_user_id UUID REFERENCES users(id),
  admin_reason TEXT,
  custom_message VARCHAR(200),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_model_transitions (model_id, created_at DESC),
  INDEX idx_changed_by (changed_by, created_at DESC),
  INDEX idx_new_state (new_state, created_at DESC)
);
```

### Messaging Templates Schema
```sql
CREATE TABLE mood_messaging_templates (
  id UUID PRIMARY KEY,
  mood_state VARCHAR(20) NOT NULL CHECK (mood_state IN ('neutral', 'positive', 'negative')),
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('greeting', 'farewell', 'auto_response', 'tip_thank_you')),
  tier_level VARCHAR(20) CHECK (tier_level IN ('free', 'bronze', 'silver', 'gold', 'platinum')),
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_mood_type (mood_state, template_type, tier_level, active),
  INDEX idx_priority (priority DESC, created_at DESC),
  INDEX idx_active (active, mood_state)
);
```

### Rate Limit Tracking Schema
```sql
CREATE TABLE mood_rate_limits (
  id UUID PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  change_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL DEFAULT NOW(),
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_model_window (model_id, window_end),
  INDEX idx_window_end (window_end)
);
```

## Integration Points

### Message Service Integration

The Mood Messaging System integrates with the existing Message Service for:

1. **Auto-Response Generation**:
```typescript
// When a user sends a message and model has auto-respond enabled
const moodState = await moodService.getMoodState(modelId);
if (moodState.autoRespond) {
  const template = await moodService.getTemplate({
    modelId,
    templateType: 'auto_response',
    userTier: user.tier
  });
  
  const response = await moodService.renderTemplate({
    template,
    variables: { userName: user.name, modelName: model.name }
  });
  
  // Delay response if configured
  setTimeout(() => {
    messageService.sendAutoReply(conversationId, response);
  }, moodState.responseDelay * 1000);
}
```

2. **Greeting Messages**:
```typescript
// When a user initiates a conversation
const template = await moodService.getTemplate({
  modelId,
  templateType: 'greeting',
  userTier: user.tier
});

const greeting = await moodService.renderTemplate({
  template,
  variables: { userName: user.name, modelName: model.name }
});
```

3. **Tip Thank You Messages**:
```typescript
// When a user sends a tip
const template = await moodService.getTemplate({
  modelId,
  templateType: 'tip_thank_you',
  userTier: user.tier
});

const thankYou = await moodService.renderTemplate({
  template,
  variables: { userName: user.name, amount: tipAmount }
});
```

### User Service Integration (Read-Only)

Query user tier information for template personalization:

```typescript
const userTier = await userService.getUserTier(userId);
```

### Performer Service Integration (Read-Only)

Verify model permissions and retrieve model information:

```typescript
const isModel = await performerService.isPerformer(userId);
const modelInfo = await performerService.getPerformer(modelId);
```

### Analytics Integration

Send mood change events for analytics:

```typescript
analyticsService.trackEvent({
  eventType: 'mood_changed',
  modelId,
  previousState,
  newState,
  timestamp: new Date()
});
```

## Acceptance Criteria

### Functional Requirements
- [ ] **FR-1**: Models can view their current mood state
- [ ] **FR-2**: Models can update their mood state to neutral, positive, or negative
- [ ] **FR-3**: Models can set optional custom message (max 200 chars)
- [ ] **FR-4**: Models can enable/disable auto-responses
- [ ] **FR-5**: Models can set response delay (0-300 seconds)
- [ ] **FR-6**: Models can set mood expiration time
- [ ] **FR-7**: System automatically resets mood to neutral on expiration
- [ ] **FR-8**: Users can view model mood states (public information)
- [ ] **FR-9**: System enforces rate limits (50 changes per hour)
- [ ] **FR-10**: System provides mood-based messaging templates
- [ ] **FR-11**: Templates support user tier-based personalization
- [ ] **FR-12**: System logs all mood transitions for audit
- [ ] **FR-13**: Admins can override model mood states with reason
- [ ] **FR-14**: Admins can create/update messaging templates
- [ ] **FR-15**: Templates support variable substitution

### Security Requirements
- [ ] **SEC-1**: All API endpoints require valid authentication
- [ ] **SEC-2**: Models can only update their own mood states
- [ ] **SEC-3**: Users have read-only access to mood states
- [ ] **SEC-4**: Admins require special authorization for override actions
- [ ] **SEC-5**: All mood transitions logged with complete audit trail
- [ ] **SEC-6**: Custom messages sanitized to prevent XSS
- [ ] **SEC-7**: Rate limiting prevents abuse
- [ ] **SEC-8**: NO PII in mood data or templates
- [ ] **SEC-9**: Sensitive data encrypted in transit and at rest
- [ ] **SEC-10**: Security review completed and approved

### Performance Requirements
- [ ] **PERF-1**: Get mood state latency < 50ms (p95)
- [ ] **PERF-2**: Update mood state latency < 100ms (p95)
- [ ] **PERF-3**: Template retrieval latency < 75ms (p95)
- [ ] **PERF-4**: System handles 500 updates per second
- [ ] **PERF-5**: System maintains 99.9% uptime SLA
- [ ] **PERF-6**: Database queries optimized with proper indexes
- [ ] **PERF-7**: Caching implemented for current mood states

### Integration Requirements
- [ ] **INT-1**: Message service auto-response integration working
- [ ] **INT-2**: User tier information retrieved correctly
- [ ] **INT-3**: Performer verification integrated
- [ ] **INT-4**: Analytics events tracked properly
- [ ] **INT-5**: Graceful degradation if mood service unavailable

### Testing Requirements
- [ ] **TEST-1**: Unit tests cover 90%+ of business logic
- [ ] **TEST-2**: Integration tests cover all API endpoints
- [ ] **TEST-3**: Tests validate rate limiting enforcement
- [ ] **TEST-4**: Tests validate template rendering with variables
- [ ] **TEST-5**: Tests validate mood state transitions
- [ ] **TEST-6**: Tests validate authorization rules
- [ ] **TEST-7**: E2E tests cover complete user workflows

### Documentation Requirements
- [ ] **DOC-1**: API documentation published
- [ ] **DOC-2**: System architecture diagram created
- [ ] **DOC-3**: Integration guide for message service
- [ ] **DOC-4**: Admin user guide for template management
- [ ] **DOC-5**: Model user guide for mood management
- [ ] **DOC-6**: Deployment runbook documented

## Implementation Phases

### Phase 1: Foundation (BLOCKED until briefing merged)
- Backend API scaffold
- Database schema creation
- Basic authentication integration
- Rate limiting implementation

### Phase 2: Core Functionality (BLOCKED until briefing merged)
- Mood state management service
- CRUD operations for mood states
- Mood transition audit logging
- Rate limit enforcement

### Phase 3: Template System (BLOCKED until briefing merged)
- Template storage and retrieval
- Variable substitution engine
- Tier-based template selection
- Template management API

### Phase 4: Integrations (BLOCKED until briefing merged)
- Message service integration
- User service integration
- Performer service integration
- Analytics event tracking

### Phase 5: Admin Interface (BLOCKED until briefing merged)
- Admin mood override functionality
- Template CRUD operations
- Analytics dashboard
- Audit log viewer

### Phase 6: Testing & Validation (BLOCKED until briefing merged)
- Comprehensive testing suite
- Load and performance testing
- Security testing
- Integration testing

### Phase 7: Deployment (BLOCKED until briefing merged)
- Staging environment deployment
- Production deployment planning
- Monitoring and alerting setup
- Feature flag configuration

## Dependencies

### Internal Dependencies
- Message Service API (for auto-responses)
- User Service (read-only, for tier information)
- Performer Service (read-only, for model verification)
- Authentication Service (for session validation)
- Database Infrastructure (PostgreSQL)
- Monitoring and Logging Infrastructure

### External Dependencies
- None (all dependencies are internal platform services)

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Mood state abuse (rapid changes) | Medium | Medium | Rate limiting (50/hour), audit logging, admin alerts |
| Template injection vulnerabilities | High | Low | Strict input validation, XSS sanitization, template sandboxing |
| Performance impact on messaging | Medium | Low | Caching, efficient queries, graceful degradation |
| Integration complexity | Medium | Medium | Clear API contracts, comprehensive testing, staged rollout |
| User confusion with mood states | Low | Medium | Clear UI/UX, help documentation, tooltips |
| Data consistency issues | High | Low | Atomic operations, database transactions, proper indexing |
| Privacy concerns with mood data | Low | Low | Mood is public information, no PII, clear terms of service |

## Success Metrics

### Business Metrics
- Model adoption rate (% of models using mood feature)
- Mood change frequency (average changes per model per day)
- User engagement impact (message response rate with mood-based templates)
- User satisfaction (surveys on mood-based messaging)
- Model satisfaction (surveys on mood feature usefulness)

### Technical Metrics
- API latency (p50, p95, p99)
- Error rate (< 0.1% of requests)
- System availability (99.9% uptime)
- Cache hit ratio (> 80% for mood states)
- Database query performance

### Security Metrics
- Authentication failure rate
- Rate limit trigger frequency
- Authorization violation attempts
- Security incident count
- Audit log completeness

### Feature Adoption Metrics
- Number of models with active mood states
- Distribution of mood states (neutral vs positive vs negative)
- Template usage by type
- Auto-response engagement rate

## Constraints and Guidelines

### Financial System Separation

**CRITICAL**: The mood messaging system must NOT interfere with financial operations:

1. **No Payment Integration**: Mood states do NOT affect pricing, tipping, or payments
2. **RedRoomRewards Isolation**: NO integration with RedRoomRewards payment system
3. **No Token Impact**: Mood changes do NOT grant, deduct, or influence token balances
4. **Promotional Separation**: Mood data MUST NOT be used for financial promotions
5. **Audit Separation**: Mood audit logs are separate from financial transaction logs

### Least-Privilege Principles

1. **Read vs Write**: Separate read and write permissions clearly
2. **Model Ownership**: Models control only their own mood states
3. **Admin Justification**: Admin overrides require documented reason
4. **Service Accounts**: Integration services have minimal necessary permissions
5. **No Backdoors**: NO master passwords, magic strings, or undocumented overrides

### Modular Design

1. **Loose Coupling**: Mood service operates independently from other services
2. **Clear Interfaces**: Well-defined API contracts
3. **Graceful Degradation**: System functions with reduced features if mood service down
4. **Stateless Operations**: API endpoints are stateless where possible
5. **Event-Driven**: Use events for analytics and notifications

### Performance Optimization

1. **Caching**: Cache current mood states with appropriate TTL
2. **Indexing**: Proper database indexes for fast queries
3. **Query Optimization**: Use efficient queries, avoid N+1 problems
4. **Connection Pooling**: Efficient database connection management
5. **Async Operations**: Long-running operations handled asynchronously

## Review and Approval

**This briefing document must be reviewed and approved by the following stakeholders before any implementation work begins:**

- [ ] Product Owner - Feature requirements and business logic
- [ ] Backend Engineering Lead - Technical architecture and feasibility
- [ ] Security Engineer - Security requirements and threat model
- [ ] Database Administrator - Data model and scalability
- [ ] Legal/Compliance - Data privacy and terms of service
- [ ] UX/UI Lead - User experience and model dashboard design
- [ ] Message Service Team - Integration approach and API contracts

**Merge Approval**: This briefing must be merged to main branch and approved by all stakeholders before any scaffold or implementation commits are created.

---

## Document Control

- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-02
- **Last Updated**: 2026-01-02
- **Next Review**: Upon completion of stakeholder review
- **Related Documents**: 
  - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
  - COPILOT_GOVERNANCE.md
  - MODEL_MOOD_RESPONSE_SYSTEM.md (foundational document)
  - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (reference example)

## Questions or Clarifications

For questions about this briefing, please contact:
- Product: product-team@xxxchatnow.com
- Technical: engineering-team@xxxchatnow.com
- Security: security-team@xxxchatnow.com
- Compliance: legal@xxxchatnow.com

---

## Appendix A: Example Use Cases

### Use Case 1: Model Sets Positive Mood
1. Model logs into dashboard
2. Model selects "Positive" mood with custom message "Feeling great today!"
3. Model enables auto-responses with 30-second delay
4. System saves mood state and logs transition
5. When user messages, system waits 30 seconds and sends auto-response using positive template
6. User sees model's mood indicator showing positive state

### Use Case 2: User Tips Model
1. User sends tip to model
2. System retrieves model's current mood state (positive)
3. System retrieves tip thank you template for positive mood and user's tier (gold)
4. System renders template with user name and tip amount
5. System sends personalized thank you message
6. Message reflects positive mood with appropriate tone and emojis

### Use Case 3: Mood Auto-Expiration
1. Model sets negative mood with 2-hour expiration
2. System saves mood with expiresAt timestamp
3. Background job monitors mood expirations
4. After 2 hours, system automatically resets mood to neutral
5. System logs transition with changedBy='system'
6. Model receives notification that mood auto-reset

### Use Case 4: Admin Mood Override
1. Admin receives complaint about model's mood message
2. Admin reviews mood state and custom message
3. Admin overrides mood to neutral with reason "Inappropriate custom message"
4. System logs transition with admin user ID and reason
5. Model receives notification of admin override
6. Audit log captures complete override details

## Appendix B: Template Variable Reference

### Available Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{userName}}` | User's display name | "John123" |
| `{{modelName}}` | Model's display name | "Sophia" |
| `{{amount}}` | Tip/payment amount | "50" |
| `{{currency}}` | Currency symbol | "$" |
| `{{mood}}` | Current mood state | "positive" |
| `{{tier}}` | User tier level | "gold" |
| `{{customMessage}}` | Model's custom mood message | "Feeling great today!" |
| `{{time}}` | Current time | "3:45 PM" |
| `{{date}}` | Current date | "Jan 2, 2026" |

### Template Examples

**Positive Greeting (Gold Tier)**:
```
Hi {{userName}}! 💎 I'm so excited to chat with you today! {{customMessage}}
```

**Neutral Auto-Response**:
```
Thanks for your message, {{userName}}. I'll respond as soon as I can!
```

**Negative Farewell**:
```
Thanks for stopping by, {{userName}}. Take care.
```

**Positive Tip Thank You (Platinum Tier)**:
```
WOW! 🌟 Thank you SO much {{userName}} for the {{currency}}{{amount}} tip! You're absolutely amazing! 💖✨
```

## Appendix C: Rate Limiting Details

### Mood Change Rate Limits

- **Hourly Limit**: 50 mood changes per model per hour
- **Window**: Rolling 60-minute window
- **Enforcement**: Server-side, database-backed
- **Response**: HTTP 429 with resetTime

### Rate Limit Algorithm

```typescript
async checkRateLimit(modelId: string): Promise<void> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Count mood changes in last hour
  const changeCount = await this.countMoodChanges(modelId, oneHourAgo, now);
  
  if (changeCount >= 50) {
    const oldestChange = await this.getOldestChangeInWindow(modelId, oneHourAgo);
    const resetTime = new Date(oldestChange.timestamp.getTime() + 60 * 60 * 1000);
    
    throw new RateLimitExceededException({
      message: 'Maximum 50 mood changes per hour exceeded',
      resetTime
    });
  }
}
```

### Exemptions

- System-initiated mood resets (expirations) do NOT count toward rate limit
- Admin-initiated mood overrides do NOT count toward rate limit (but are logged)

## Appendix D: Security Considerations

### XSS Prevention

All user-provided content (custom messages, template variables) must be sanitized:

```typescript
import { sanitize } from 'sanitize-html';

function sanitizeCustomMessage(message: string): string {
  return sanitize(message, {
    allowedTags: [],  // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape'
  });
}
```

### SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✅ CORRECT
const result = await db.query(
  'SELECT * FROM model_mood_states WHERE model_id = $1',
  [modelId]
);

// ❌ INCORRECT - NEVER DO THIS
const result = await db.query(
  `SELECT * FROM model_mood_states WHERE model_id = '${modelId}'`
);
```

### Authentication Validation

```typescript
@UseGuards(AuthGuard('jwt'))
@Controller('mood')
export class MoodController {
  @Post('update')
  async updateMood(@CurrentUser() user: User, @Body() dto: UpdateMoodDto) {
    // Verify user is a model
    if (user.role !== 'model') {
      throw new ForbiddenException('Only models can update mood states');
    }
    
    // Verify user owns the mood they're updating
    if (dto.modelId !== user.id) {
      throw new ForbiddenException('Cannot update another model\'s mood');
    }
    
    // Proceed with update
    return this.moodService.updateMood(user.id, dto);
  }
}
```

### Audit Logging

Log all significant operations:

```typescript
await this.auditLogger.log({
  action: 'mood_updated',
  actorId: user.id,
  actorType: 'model',
  resourceType: 'mood_state',
  resourceId: modelId,
  previousValue: previousMoodState,
  newValue: newMoodState,
  metadata: {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  },
  timestamp: new Date()
});
```

## Appendix E: Monitoring and Alerting

### Key Metrics to Monitor

1. **Mood Change Rate**: Changes per hour (alert if > 1000)
2. **Error Rate**: Failed API requests (alert if > 1%)
3. **Latency**: p95 response times (alert if > 200ms)
4. **Rate Limit Hits**: Number of rate limit violations (alert if > 100/hour)
5. **Template Render Failures**: Failed template renders (alert if > 10/hour)

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Error Rate | > 0.5% | > 1% |
| p95 Latency | > 150ms | > 300ms |
| Rate Limit Hits | > 50/hour | > 100/hour |
| Template Failures | > 5/hour | > 10/hour |
| Database Connection Errors | > 5/minute | > 10/minute |

### Health Check Endpoint

```typescript
@Get('health')
async healthCheck(): Promise<HealthCheckResult> {
  return {
    status: 'healthy',
    timestamp: new Date(),
    checks: {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      messageService: await this.checkMessageService()
    }
  };
}
```
