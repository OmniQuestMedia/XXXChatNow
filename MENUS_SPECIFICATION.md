# Model Menus Specification

**Version**: 1.0  
**Date**: 2026-01-02  
**Status**: Authoritative  
**Owner**: XXXChatNow Engineering Team

## Table of Contents

1. [Overview](#overview)
2. [Menu Structure](#menu-structure)
3. [State Management](#state-management)
4. [UI/UX Flow](#uiux-flow)
5. [Integration Boundaries](#integration-boundaries)
6. [Security and Compliance](#security-and-compliance)
7. [API Specification](#api-specification)
8. [Data Models](#data-models)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Testing Requirements](#testing-requirements)

---

## Overview

### Purpose

This document defines the comprehensive specification for Model Menus in XXXChatNow - a context-aware, state-driven menu system that provides models with intuitive access to platform features and controls during their streaming sessions.

### Scope

Model Menus encompass:
- **Navigation Menus**: Hierarchical navigation for accessing platform features
- **Context Menus**: State-dependent action menus during streaming/performance
- **Quick Actions**: Frequently accessed operations and settings
- **Integration Points**: Connections to queue management, promotions, mood settings, and financial operations

### Design Principles

1. **Context Awareness**: Menu items adapt based on model's current state (idle, streaming, performing, offline)
2. **Least Privilege**: Menu actions respect role-based access control and security boundaries
3. **Separation of Concerns**: Menu UI is decoupled from business logic in wallet, queue, and promotion systems
4. **Auditability**: All menu-triggered financial or privileged operations are logged
5. **Responsiveness**: Menus provide instant feedback and handle network latency gracefully

### References

This specification builds upon and must comply with:
- **[SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements
- **[COPILOT_GOVERNANCE.md](COPILOT_GOVERNANCE.md)** - Development standards
- **[PERFORMANCE_QUEUE_ARCHITECTURE.md](PERFORMANCE_QUEUE_ARCHITECTURE.md)** - Queue integration
- **[XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)** - Feature integration
- **[MODEL_MOOD_RESPONSE_SYSTEM.md](MODEL_MOOD_RESPONSE_SYSTEM.md)** - Mood system integration

---

## Menu Structure

### Hierarchy and Organization

Model Menus follow a three-tier hierarchical structure:

#### Level 1: Primary Menu Sections

```
Model Dashboard
├── Streaming Controls
├── Queue Management
├── Financial Management
├── Settings & Preferences
└── Support & Help
```

#### Level 2: Feature Categories

Each primary section contains feature-specific categories:

**Streaming Controls**
- Start/Stop Streaming
- Broadcast Settings
- Camera & Audio Controls
- Performance Mode Toggle

**Queue Management**
- View Queue
- Join/Leave Queue
- Queue Position Status
- Performance Settings

**Financial Management**
- Wallet Balance
- Earnings Summary
- Payout Requests
- Promotion Settings

**Settings & Preferences**
- Profile Settings
- Mood Configuration
- Notification Preferences
- Schedule Management

**Support & Help**
- Help Center
- Contact Support
- System Status
- Tutorials

#### Level 3: Actions and Details

Leaf nodes represent actionable items or information displays.

### Default Menu Items

#### Common Menu Items (Always Available)

| Menu Item | Description | Access Level |
|-----------|-------------|--------------|
| Dashboard Home | Return to main dashboard | All Models |
| Profile Settings | Update profile information | All Models |
| Notification Center | View notifications and alerts | All Models |
| Help Center | Access help documentation | All Models |
| Logout | Sign out of platform | All Models |

#### Streaming Context Menu Items

| Menu Item | State Requirement | Description |
|-----------|-------------------|-------------|
| Start Stream | Idle, Not Streaming | Begin live streaming session |
| Stop Stream | Streaming Active | End live streaming session |
| Adjust Camera | Streaming Active | Configure camera settings |
| Adjust Audio | Streaming Active | Configure microphone/audio |
| Broadcast Settings | Any | Configure stream quality, privacy |

#### Queue Context Menu Items

| Menu Item | State Requirement | Description |
|-----------|-------------------|-------------|
| Join Queue | Idle, Streaming | Enter performance queue |
| Leave Queue | In Queue | Exit performance queue |
| View Queue Position | In Queue | Check current position |
| Next Performance | In Queue | View upcoming performance details |
| Performance History | Any | View completed performances |

#### Financial Context Menu Items

| Menu Item | State Requirement | Description |
|-----------|-------------------|-------------|
| View Balance | Any | Check current wallet balance |
| Earnings Today | Any | View today's earnings summary |
| Payout Request | Balance > Min | Request payout of earnings |
| Promotion Manager | Any | Create/manage promotional offers |
| Transaction History | Any | View financial transaction log |

#### Mood & Engagement Menu Items

| Menu Item | State Requirement | Description |
|-----------|-------------------|-------------|
| Set Mood | Streaming | Configure mood response settings |
| Quick Responses | Streaming | Manage pre-configured chat responses |
| Engagement Tools | Streaming | Access games, wheels, tip menus |

### Context-Sensitive Menu Behavior

Menus adapt based on the model's current state:

#### Idle State
- Full access to settings and configuration
- Streaming controls show "Start Stream"
- Queue options show "Join Queue"
- Financial operations available

#### Streaming State
- Stream controls become prominent
- "Start Stream" changes to "Stop Stream"
- Real-time engagement tools available
- Mood settings accessible

#### Performing State (Active Performance)
- Queue management restricted (cannot leave mid-performance)
- Performance timer displayed
- Completion actions available
- Financial settlement preview shown

#### Offline State
- Limited to profile viewing and settings
- Historical data access only
- No real-time controls available

---

## State Management

### Model State Machine

Model Menus operate based on a state machine that tracks the model's current operational state.

#### Primary States

```
┌─────────────┐
│   OFFLINE   │
└──────┬──────┘
       │ login
       ▼
┌─────────────┐    start stream    ┌─────────────┐
│    IDLE     │──────────────────▶│  STREAMING  │
└─────────────┘                    └──────┬──────┘
       │                                  │
       │ join queue                       │ join queue
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  IN_QUEUE   │                    │  STREAM_    │
│  (idle)     │                    │  IN_QUEUE   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ performance assigned             │ performance assigned
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│ PERFORMING  │                    │  STREAM_    │
│  (idle)     │                    │  PERFORMING │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ complete/abandon                 │ complete/abandon
       └──────────────┬──────────────────┘
                      ▼
               ┌─────────────┐
               │    IDLE/    │
               │  STREAMING  │
               └─────────────┘
```

#### State Definitions

| State | Description | Menu Access |
|-------|-------------|-------------|
| `OFFLINE` | Model not logged in | No access |
| `IDLE` | Logged in, not streaming | Full configuration access |
| `STREAMING` | Live stream active | Streaming controls + full access |
| `IN_QUEUE` | Awaiting performance assignment | Queue status, limited config |
| `PERFORMING` | Active performance in progress | Performance controls only |
| `STREAM_IN_QUEUE` | Streaming + in queue | Combined controls |
| `STREAM_PERFORMING` | Streaming + performing | Performance priority UI |

#### State Transition Rules

**Transitions TO streaming states:**
- `IDLE → STREAMING`: Model clicks "Start Stream" → verify broadcast settings → activate stream
- `STREAMING → STREAM_IN_QUEUE`: Model clicks "Join Queue" while streaming → validate eligibility → add to queue

**Transitions TO performing states:**
- `IN_QUEUE → PERFORMING`: Queue system assigns performance → notify model → transition
- `STREAM_IN_QUEUE → STREAM_PERFORMING`: Same as above, but stream continues

**Transitions FROM performing states:**
- `PERFORMING → IDLE`: Performance completed OR abandoned → settle finances → transition
- `STREAM_PERFORMING → STREAMING`: Performance completed OR abandoned → settle finances → continue streaming

**Transition Constraints:**
- **Cannot** leave queue during active performance (must complete or abandon first)
- **Cannot** stop stream during active performance (must complete performance first, stream continues)
- **Cannot** start new performance if another is active (single-performance enforcement)

### Menu State Synchronization

Menu state is synchronized through:

1. **WebSocket Events**: Real-time state changes pushed from server
2. **Polling Fallback**: Periodic state check if WebSocket unavailable (every 10 seconds)
3. **Action Feedback**: Immediate local state update + server confirmation
4. **Error Recovery**: Revert to server state if local action fails

#### State Update Flow

```
Model Action → Local UI Update (optimistic) → API Request → Server Validation
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                    Success               Failure
                                          │                   │
                                  Confirm State         Revert State
                                  WebSocket Broadcast   Show Error
```

### State Persistence

State is persisted across sessions:

- **Server-Side State**: Authoritative state stored in database
- **Session Recovery**: On reconnect, menu loads last known state from server
- **State Conflicts**: Server state always wins in case of conflict

---

## UI/UX Flow

### Responsive Design Requirements

#### Desktop Layout (≥1024px)
- Full sidebar navigation with expanded menu items
- Hover tooltips for additional context
- Keyboard shortcuts enabled
- Multi-column dashboard view

#### Tablet Layout (768px - 1023px)
- Collapsible sidebar with icons + text
- Touch-optimized tap targets (min 44px)
- Swipe gestures for drawer navigation

#### Mobile Layout (<768px)
- Bottom navigation bar for primary sections
- Hamburger menu for secondary items
- Full-screen modal menus
- Minimal chrome during streaming

### Menu Interaction Patterns

#### Navigation Menu
- **Access**: Persistent sidebar (desktop) or drawer (mobile)
- **Behavior**: Click to navigate, close drawer after selection on mobile
- **Visual Feedback**: Highlight current section, breadcrumb trail

#### Context Menu
- **Trigger**: Right-click on stream canvas, queue item, or transaction
- **Content**: Context-specific actions based on clicked item
- **Positioning**: Near cursor, bounded within viewport

#### Quick Action Menu
- **Access**: Floating action button (FAB) or toolbar icons
- **Content**: Top 3-5 most frequent actions based on current state
- **Customization**: Models can pin/unpin actions

### Loading States and Feedback

#### Immediate Feedback
- Button states change instantly on click (loading spinner)
- Optimistic UI updates for non-financial actions
- Disable action buttons during processing

#### Progressive Loading
- Menu structure loads first (skeleton)
- State-dependent items load asynchronously
- Show shimmer placeholders during load

#### Error States
- Inline error messages for failed actions
- Toast notifications for system-level errors
- Retry buttons for recoverable failures

### Accessibility Requirements

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape, Arrow keys)
- **Screen Readers**: ARIA labels on all menu items and actions
- **Focus Management**: Logical tab order, visible focus indicators
- **Color Contrast**: WCAG AA compliance (4.5:1 minimum)
- **Motion**: Respect `prefers-reduced-motion` setting

### Customization Options

Models can customize:

1. **Quick Actions**: Pin/unpin frequently used menu items
2. **Menu Order**: Reorder sections within constraints (streaming controls always first)
3. **Notifications**: Configure which menu actions trigger notifications
4. **Dashboard Widgets**: Choose which widgets appear on dashboard
5. **Keyboard Shortcuts**: Customize hotkeys for common actions

Customizations are:
- Saved per-user in database
- Synced across devices
- Reversible to defaults

---

## Integration Boundaries

### Architectural Principles

Model Menus serve as a **presentation layer** only. Business logic resides in domain-specific modules.

#### Clear Boundaries

```
┌────────────────────────────────────────────┐
│         Model Menu UI (Presentation)        │
│  - Display menu structure                   │
│  - Handle user interactions                 │
│  - Validate user intent                     │
│  - Trigger API calls                        │
└────────────┬───────────────────────────────┘
             │ API Calls Only
             ▼
┌────────────────────────────────────────────┐
│      API Controllers (Gateway Layer)        │
│  - Authentication/Authorization             │
│  - Input validation                         │
│  - Route to appropriate service             │
└────────────┬───────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌─────────────┐
│ Queue   │     │   Wallet    │
│ Service │     │   Service   │
└─────────┘     └─────────────┘
    │                 │
    │                 │
┌─────────┐     ┌─────────────┐
│ Mood    │     │  Promotion  │
│ Service │     │   Service   │
└─────────┘     └─────────────┘
```

### Integration with Performance Queue

Per **[XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)**:

#### Menu Responsibilities
- Display current queue position
- Show "Join Queue" / "Leave Queue" buttons
- Display upcoming performance details
- Show queue-related notifications

#### Menu MUST NOT
- Implement queue ordering logic
- Settle escrow transactions
- Manipulate queue state directly
- Override queue lifecycle rules

#### Menu Integration Pattern

```typescript
// Menu triggers action
async joinQueue() {
  try {
    // Menu only validates UI state and triggers API
    if (!this.canJoinQueue()) {
      this.showError("Cannot join queue in current state");
      return;
    }
    
    // Call queue service API
    const result = await queueApi.join({
      modelId: this.currentUser.id,
      idempotencyKey: generateIdempotencyKey()
    });
    
    // Update menu state based on response
    this.updateMenuState(result.newState);
    this.showSuccess("Successfully joined queue");
  } catch (error) {
    this.handleError(error);
  }
}
```

### Integration with Wallet System

Per **[WALLET_MODULE_IMPLEMENTATION_SUMMARY.md](WALLET_MODULE_IMPLEMENTATION_SUMMARY.md)**:

#### Menu Responsibilities
- Display current balance
- Show earnings summary
- Trigger payout requests
- Display transaction history

#### Menu MUST NOT
- Perform balance calculations
- Execute wallet transactions
- Settle escrow funds
- Override rate limits

#### Menu Integration Pattern

```typescript
// Menu displays balance, delegates operations to wallet service
async requestPayout() {
  try {
    // Validate UI state only
    if (this.balance < this.minPayoutAmount) {
      this.showError(`Minimum payout is ${this.minPayoutAmount}`);
      return;
    }
    
    // Call wallet service API with idempotency
    const result = await walletApi.requestPayout({
      modelId: this.currentUser.id,
      amount: this.payoutAmount,
      idempotencyKey: generateIdempotencyKey()
    });
    
    // Update UI based on response
    this.showSuccess(`Payout request submitted: ${result.requestId}`);
    this.refreshBalance();
  } catch (error) {
    // Handle rate limits, insufficient balance, etc.
    this.handleError(error);
  }
}
```

### Integration with Mood System

Per **[MODEL_MOOD_RESPONSE_SYSTEM.md](MODEL_MOOD_RESPONSE_SYSTEM.md)**:

#### Menu Responsibilities
- Display mood configuration interface
- Allow selection of mood templates
- Trigger mood updates
- Show current mood status

#### Menu MUST NOT
- Analyze chat sentiment
- Generate mood responses
- Override mood detection logic
- Store mood templates

#### Menu Integration Pattern

```typescript
// Menu provides UI for mood selection, service handles logic
async setMood(moodType: MoodType) {
  try {
    // Call mood service API
    await moodApi.updateMood({
      modelId: this.currentUser.id,
      mood: moodType,
      autoRespond: this.autoRespondEnabled
    });
    
    // Update menu indicator
    this.currentMood = moodType;
    this.showSuccess(`Mood set to ${moodType}`);
  } catch (error) {
    this.handleError(error);
  }
}
```

### Integration with Promotion System

#### Menu Responsibilities
- Display promotion creation interface
- Show active promotions
- Toggle promotion status (enable/disable)
- Display promotion performance metrics

#### Menu MUST NOT
- Calculate promotion pricing
- Apply discounts to transactions
- Track promotion usage directly
- Override promotion rules

#### Menu Integration Pattern

```typescript
// Menu provides UI for promotion management
async createPromotion(promotionData: PromotionPayload) {
  try {
    // Validate input on client side
    if (!this.validatePromotionData(promotionData)) {
      this.showError("Invalid promotion data");
      return;
    }
    
    // Call promotion service API
    const result = await promotionApi.create({
      modelId: this.currentUser.id,
      ...promotionData,
      idempotencyKey: generateIdempotencyKey()
    });
    
    // Update menu display
    this.promotions.push(result);
    this.showSuccess("Promotion created successfully");
  } catch (error) {
    this.handleError(error);
  }
}
```

### Service Discovery

Menus discover available features through:

1. **Feature Flags**: Check if feature is enabled for model
2. **Permission Check**: Verify model has required permissions
3. **State Validation**: Ensure action is valid in current state

```typescript
// Example: Determine which menu items to show
getAvailableMenuItems(): MenuItem[] {
  const items: MenuItem[] = [
    // Always available
    { id: 'dashboard', label: 'Dashboard', icon: 'home' }
  ];
  
  // Conditional based on feature flags
  if (this.featureFlags.queueEnabled) {
    items.push({ id: 'queue', label: 'Queue', icon: 'list' });
  }
  
  // Conditional based on permissions
  if (this.permissions.includes('MANAGE_PROMOTIONS')) {
    items.push({ id: 'promotions', label: 'Promotions', icon: 'tag' });
  }
  
  // Conditional based on state
  if (this.state === 'STREAMING') {
    items.push({ id: 'mood', label: 'Mood Settings', icon: 'emoji' });
  }
  
  return items;
}
```

---

## Security and Compliance

### Authentication and Authorization

#### Authentication Requirements

All menu interactions require:
- Valid authentication token (JWT)
- Active session (not expired)
- Model role verification

```typescript
// All menu API calls must include authentication
headers: {
  'Authorization': `Bearer ${authToken}`,
  'X-Session-Id': sessionId
}
```

#### Authorization Checks

Menu items are filtered based on:
1. **Role**: Model, Studio Manager, Admin
2. **Permissions**: Granular permissions per feature
3. **State**: Current operational state
4. **Feature Flags**: Enabled features for account

```typescript
// Server-side authorization check before menu rendering
async getMenuForModel(modelId: ObjectId): Promise<Menu> {
  const model = await this.modelService.findById(modelId);
  const permissions = await this.getPermissions(model.role);
  const featureFlags = await this.getFeatureFlags(model.id);
  
  return this.buildMenu({
    role: model.role,
    permissions,
    featureFlags,
    state: model.currentState
  });
}
```

### Least Privilege Policy

Menu access follows least privilege principles:

#### Financial Operations
- **View balance**: Requires `READ_WALLET` permission
- **Request payout**: Requires `REQUEST_PAYOUT` permission + minimum balance
- **View transactions**: Requires `READ_TRANSACTIONS` permission + own data only

#### Queue Operations
- **Join queue**: Requires `JOIN_QUEUE` permission + valid state
- **Leave queue**: Requires `LEAVE_QUEUE` permission + not performing
- **View queue**: Requires `READ_QUEUE` permission

#### Promotion Operations
- **Create promotion**: Requires `CREATE_PROMOTION` permission + verified model
- **Manage promotions**: Requires `MANAGE_PROMOTIONS` permission + own promotions only
- **View analytics**: Requires `READ_ANALYTICS` permission

### Sensitive Data Protection

#### No PII in Menu Logs
Menu interactions are logged WITHOUT personally identifiable information:

```typescript
// ✅ Correct logging
logger.info('Menu action', {
  action: 'join_queue',
  modelId: model._id,  // ID only, no name/email
  timestamp: new Date(),
  success: true
});

// ❌ Incorrect logging (contains PII)
logger.info('Menu action', {
  action: 'join_queue',
  modelName: model.name,     // PII
  modelEmail: model.email,   // PII
  ipAddress: req.ip,         // PII
  success: true
});
```

#### Secure Credential Handling
- NO credentials stored in menu state
- NO authentication tokens in localStorage (use httpOnly cookies)
- NO sensitive data in URL parameters

### Idempotency Requirements

All state-changing menu actions require idempotency keys:

```typescript
// Generate idempotency key for action
const idempotencyKey = `${modelId}_${action}_${timestamp}_${nonce}`;

// Include in API request
await api.post('/queue/join', {
  modelId,
  idempotencyKey
}, {
  headers: {
    'Idempotency-Key': idempotencyKey
  }
});
```

Benefits:
- Prevents duplicate actions on retry
- Safe for network failures
- Allows replay attack prevention

### Rate Limiting

Menu actions are rate-limited to prevent abuse:

| Action | Rate Limit | Window |
|--------|-----------|--------|
| Join Queue | 10 attempts | 1 hour |
| Create Promotion | 5 creations | 1 hour |
| Request Payout | 3 requests | 1 day |
| Update Mood | 60 updates | 1 hour |
| Stream Start/Stop | 20 toggles | 1 hour |

Rate limits are enforced server-side and communicated to menu UI:

```typescript
// Menu respects rate limit from API response
try {
  await api.joinQueue();
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    this.showError(
      `Too many attempts. Try again at ${error.resetTime}`
    );
    this.disableButton('join-queue', error.resetTime);
  }
}
```

### Audit Logging

All privileged menu actions are logged for audit:

```typescript
// Audit log entry (server-side)
await auditLog.create({
  eventType: 'MENU_ACTION',
  action: 'REQUEST_PAYOUT',
  actorId: model._id,
  actorType: 'MODEL',
  targetResource: 'WALLET',
  targetId: wallet._id,
  metadata: {
    amount: payoutAmount,
    previousBalance: previousBalance,
    requestId: payoutRequestId
  },
  timestamp: new Date(),
  ipAddress: hashIp(req.ip),  // Hashed, not raw IP
  userAgent: sanitizeUserAgent(req.headers['user-agent']),
  success: true
});
```

Audit log includes:
- Action performed
- Actor (model ID, not PII)
- Target resource
- Metadata (non-sensitive)
- Timestamp
- Success/failure status

Audit log DOES NOT include:
- Model names, emails, phone numbers
- Raw IP addresses (hashed only)
- Session tokens
- Financial instrument details (card numbers, account numbers)

### Prohibited Actions

Menu implementations MUST NEVER:

❌ **NO master passwords or magic authentication strings**
❌ **NO backdoors or hidden admin access**
❌ **NO trusting client-side data for financial operations**
❌ **NO using Math.random() for any security-sensitive operations**
❌ **NO logging sensitive data (PII, payment details, session tokens)**
❌ **NO bypassing authentication or authorization checks**
❌ **NO exposing internal system details in error messages**

These are **CRITICAL SECURITY DEFECTS** that block all merges.

---

## API Specification

### REST Endpoints

#### Get Menu Structure

**Endpoint**: `GET /api/v1/model/menu`

**Authentication**: Required (Bearer token)

**Description**: Retrieve personalized menu structure based on model's role, permissions, and current state.

**Response**:
```json
{
  "sections": [
    {
      "id": "streaming",
      "label": "Streaming",
      "icon": "video",
      "order": 1,
      "items": [
        {
          "id": "start-stream",
          "label": "Start Stream",
          "action": "startStream",
          "enabled": true,
          "visible": true
        },
        {
          "id": "broadcast-settings",
          "label": "Settings",
          "action": "openSettings",
          "enabled": true,
          "visible": true
        }
      ]
    },
    {
      "id": "queue",
      "label": "Queue",
      "icon": "list",
      "order": 2,
      "items": [
        {
          "id": "join-queue",
          "label": "Join Queue",
          "action": "joinQueue",
          "enabled": true,
          "visible": true,
          "badge": null
        },
        {
          "id": "queue-position",
          "label": "Position: 5",
          "action": null,
          "enabled": false,
          "visible": false
        }
      ]
    }
  ],
  "quickActions": [
    {
      "id": "start-stream",
      "label": "Start Stream",
      "icon": "video",
      "action": "startStream"
    }
  ]
}
```

#### Get Model State

**Endpoint**: `GET /api/v1/model/state`

**Authentication**: Required (Bearer token)

**Description**: Get current operational state of model.

**Response**:
```json
{
  "state": "STREAMING",
  "streaming": true,
  "inQueue": false,
  "performing": false,
  "queuePosition": null,
  "currentPerformance": null,
  "lastStateChange": "2026-01-02T15:00:00Z"
}
```

#### Update Menu Preferences

**Endpoint**: `PUT /api/v1/model/menu/preferences`

**Authentication**: Required (Bearer token)

**Description**: Update model's menu customization preferences.

**Request**:
```json
{
  "quickActions": ["start-stream", "join-queue", "view-balance"],
  "sectionOrder": ["streaming", "queue", "financial", "settings"],
  "keyboardShortcuts": {
    "startStream": "ctrl+shift+s",
    "joinQueue": "ctrl+shift+q"
  }
}
```

**Response**:
```json
{
  "success": true,
  "preferences": {
    "quickActions": ["start-stream", "join-queue", "view-balance"],
    "sectionOrder": ["streaming", "queue", "financial", "settings"],
    "keyboardShortcuts": {
      "startStream": "ctrl+shift+s",
      "joinQueue": "ctrl+shift+q"
    }
  }
}
```

### WebSocket Events

#### State Change Event

**Event**: `model.state.changed`

**Description**: Broadcasted when model's operational state changes.

**Payload**:
```json
{
  "modelId": "507f1f77bcf86cd799439011",
  "previousState": "IDLE",
  "newState": "STREAMING",
  "timestamp": "2026-01-02T15:00:00Z",
  "reason": "model_action"
}
```

**Menu Response**: Update menu items based on new state.

#### Queue Event

**Event**: `model.queue.updated`

**Description**: Broadcasted when model's queue status changes.

**Payload**:
```json
{
  "modelId": "507f1f77bcf86cd799439011",
  "inQueue": true,
  "position": 5,
  "estimatedWaitTime": 300,
  "nextPerformance": {
    "id": "perf_123",
    "user": "user_456",
    "type": "private_show",
    "tokens": 1000
  }
}
```

**Menu Response**: Update queue-related menu items and badges.

#### Performance Event

**Event**: `model.performance.started`

**Description**: Broadcasted when performance begins.

**Payload**:
```json
{
  "modelId": "507f1f77bcf86cd799439011",
  "performanceId": "perf_123",
  "type": "private_show",
  "duration": 600,
  "tokens": 1000,
  "startTime": "2026-01-02T15:10:00Z"
}
```

**Menu Response**: Transition to performance mode, show timer, restrict queue actions.

---

## Data Models

### Menu Schema

```typescript
interface Menu {
  _id: ObjectId;
  title: string;
  path: string;
  internal: boolean;
  parentId?: ObjectId;
  help?: string;
  section: string;
  public: boolean;
  isOpenNewTab: boolean;
  ordering: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Model State Schema

```typescript
interface ModelState {
  modelId: ObjectId;
  state: 'OFFLINE' | 'IDLE' | 'STREAMING' | 'IN_QUEUE' | 'PERFORMING' | 
         'STREAM_IN_QUEUE' | 'STREAM_PERFORMING';
  streaming: boolean;
  inQueue: boolean;
  performing: boolean;
  queuePosition?: number;
  currentPerformanceId?: ObjectId;
  lastStateChange: Date;
}
```

### Menu Preferences Schema

```typescript
interface MenuPreferences {
  _id: ObjectId;
  modelId: ObjectId;
  quickActions: string[];  // Menu item IDs
  sectionOrder: string[];  // Section IDs
  keyboardShortcuts: Record<string, string>;  // action -> key combo
  hiddenSections: string[];  // Section IDs to hide
  customWidgets: string[];  // Widget IDs for dashboard
  createdAt: Date;
  updatedAt: Date;
}
```

### Menu Action Log Schema

```typescript
interface MenuActionLog {
  _id: ObjectId;
  modelId: ObjectId;
  action: string;
  menuItemId: string;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, any>;  // Non-PII only
  timestamp: Date;
  durationMs: number;
}
```

---

## Implementation Guidelines

### Frontend Implementation

#### Technology Stack
- **Framework**: React (with hooks)
- **State Management**: Redux Toolkit
- **UI Components**: Ant Design
- **WebSocket**: Socket.io-client
- **API Client**: Axios with interceptors

#### Component Structure

```
src/components/model-menu/
├── ModelMenu.tsx                 # Main menu container
├── MenuSection.tsx               # Menu section component
├── MenuItem.tsx                  # Individual menu item
├── QuickActions.tsx              # Quick action toolbar
├── StateIndicator.tsx            # Current state display
├── hooks/
│   ├── useModelState.ts         # State management hook
│   ├── useMenuPreferences.ts    # Preferences management
│   └── useWebSocket.ts          # WebSocket integration
├── services/
│   ├── menuApi.ts               # Menu API client
│   └── stateApi.ts              # State API client
└── types/
    ├── menu.types.ts            # TypeScript types
    └── state.types.ts           # State types
```

#### State Management Pattern

```typescript
// Redux slice for menu state
const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    structure: null,
    modelState: null,
    preferences: null,
    loading: false,
    error: null
  },
  reducers: {
    setMenuStructure: (state, action) => {
      state.structure = action.payload;
    },
    setModelState: (state, action) => {
      state.modelState = action.payload;
    },
    setPreferences: (state, action) => {
      state.preferences = action.payload;
    }
  }
});
```

#### WebSocket Integration

```typescript
// Hook for WebSocket state updates
function useModelState() {
  const dispatch = useDispatch();
  const socket = useWebSocket();
  
  useEffect(() => {
    socket.on('model.state.changed', (data) => {
      dispatch(setModelState(data.newState));
      // Refresh menu structure based on new state
      dispatch(fetchMenuStructure());
    });
    
    return () => {
      socket.off('model.state.changed');
    };
  }, [socket, dispatch]);
}
```

### Backend Implementation

#### Technology Stack
- **Framework**: NestJS
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT with Guards
- **WebSocket**: Socket.io
- **Caching**: Redis

#### Service Architecture

```
api/src/modules/model-menu/
├── model-menu.module.ts
├── controllers/
│   ├── model-menu.controller.ts      # REST endpoints
│   └── menu-websocket.gateway.ts     # WebSocket events
├── services/
│   ├── model-menu.service.ts         # Menu structure logic
│   ├── model-state.service.ts        # State management
│   └── menu-preferences.service.ts   # Preferences management
├── schemas/
│   ├── model-state.schema.ts
│   ├── menu-preferences.schema.ts
│   └── menu-action-log.schema.ts
├── dtos/
│   ├── menu.dto.ts
│   ├── model-state.dto.ts
│   └── menu-preferences.dto.ts
└── guards/
    ├── model-auth.guard.ts           # Model authentication
    └── model-state.guard.ts          # State-based authorization
```

#### Service Implementation Pattern

```typescript
@Injectable()
export class ModelMenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<Menu>,
    @InjectModel(ModelState.name) private stateModel: Model<ModelState>,
    private readonly permissionService: PermissionService,
    private readonly featureFlagService: FeatureFlagService
  ) {}
  
  async getMenuForModel(modelId: ObjectId): Promise<MenuDto> {
    // Get model's current state
    const state = await this.stateModel.findOne({ modelId });
    
    // Get model's permissions
    const permissions = await this.permissionService.getPermissions(modelId);
    
    // Get enabled feature flags
    const features = await this.featureFlagService.getFeatures(modelId);
    
    // Build menu structure
    const sections = await this.buildMenuSections({
      state: state.state,
      permissions,
      features
    });
    
    // Get quick actions from preferences
    const quickActions = await this.getQuickActions(modelId);
    
    return {
      sections,
      quickActions
    };
  }
  
  private async buildMenuSections(context: MenuContext): Promise<MenuSection[]> {
    const allSections = await this.menuModel.find({ public: true })
      .sort({ ordering: 1 });
    
    return allSections
      .filter(section => this.isVisible(section, context))
      .map(section => this.buildSection(section, context));
  }
  
  private isVisible(section: Menu, context: MenuContext): boolean {
    // Check feature flag
    if (!context.features.includes(section.section)) {
      return false;
    }
    
    // Check permissions
    const requiredPermission = this.getRequiredPermission(section);
    if (requiredPermission && !context.permissions.includes(requiredPermission)) {
      return false;
    }
    
    // Check state constraints
    if (section.section === 'queue' && context.state === 'OFFLINE') {
      return false;
    }
    
    return true;
  }
}
```

### Testing Strategy

#### Unit Tests
- Menu service logic (structure building, filtering)
- State transition validation
- Permission checking
- Preference management

#### Integration Tests
- Menu API endpoints
- WebSocket event handling
- State synchronization
- Authentication/authorization

#### E2E Tests
- Complete menu navigation flows
- State-dependent menu changes
- Quick action customization
- Error handling scenarios

---

## Testing Requirements

### Unit Testing

#### Menu Service Tests

```typescript
describe('ModelMenuService', () => {
  it('should build menu structure based on state', async () => {
    const menu = await service.getMenuForModel(modelId);
    expect(menu.sections).toBeDefined();
  });
  
  it('should filter sections based on permissions', async () => {
    const menu = await service.getMenuForModel(modelIdWithLimitedPermissions);
    expect(menu.sections.find(s => s.id === 'admin')).toBeUndefined();
  });
  
  it('should show streaming controls when streaming', async () => {
    await stateService.updateState(modelId, 'STREAMING');
    const menu = await service.getMenuForModel(modelId);
    const streamingSection = menu.sections.find(s => s.id === 'streaming');
    expect(streamingSection.items.find(i => i.id === 'stop-stream')).toBeDefined();
  });
  
  it('should hide queue leave action during performance', async () => {
    await stateService.updateState(modelId, 'PERFORMING');
    const menu = await service.getMenuForModel(modelId);
    const queueSection = menu.sections.find(s => s.id === 'queue');
    const leaveAction = queueSection.items.find(i => i.id === 'leave-queue');
    expect(leaveAction.enabled).toBe(false);
  });
});
```

#### State Management Tests

```typescript
describe('ModelStateService', () => {
  it('should transition from IDLE to STREAMING', async () => {
    await service.transitionState(modelId, 'STREAMING');
    const state = await service.getState(modelId);
    expect(state.state).toBe('STREAMING');
    expect(state.streaming).toBe(true);
  });
  
  it('should prevent leaving queue during performance', async () => {
    await service.transitionState(modelId, 'PERFORMING');
    await expect(
      service.transitionState(modelId, 'IDLE')
    ).rejects.toThrow('Cannot leave queue during performance');
  });
  
  it('should emit WebSocket event on state change', async () => {
    const emitSpy = jest.spyOn(gateway, 'emitStateChange');
    await service.transitionState(modelId, 'STREAMING');
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId,
        newState: 'STREAMING'
      })
    );
  });
});
```

### Integration Testing

#### API Endpoint Tests

```typescript
describe('ModelMenuController (e2e)', () => {
  it('GET /model/menu should return menu structure', () => {
    return request(app.getHttpServer())
      .get('/api/v1/model/menu')
      .set('Authorization', `Bearer ${modelToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.sections).toBeDefined();
        expect(res.body.quickActions).toBeDefined();
      });
  });
  
  it('GET /model/menu should require authentication', () => {
    return request(app.getHttpServer())
      .get('/api/v1/model/menu')
      .expect(401);
  });
  
  it('PUT /model/menu/preferences should update preferences', () => {
    return request(app.getHttpServer())
      .put('/api/v1/model/menu/preferences')
      .set('Authorization', `Bearer ${modelToken}`)
      .send({
        quickActions: ['start-stream', 'join-queue']
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.preferences.quickActions).toEqual([
          'start-stream',
          'join-queue'
        ]);
      });
  });
});
```

### End-to-End Testing

#### Complete Flow Tests

```typescript
describe('Model Menu E2E', () => {
  it('should show appropriate menu items throughout streaming session', async () => {
    // Login as model
    await page.login(modelCredentials);
    
    // Verify IDLE state menu
    await expect(page.locator('[data-testid="start-stream"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-stream"]')).not.toBeVisible();
    
    // Start streaming
    await page.click('[data-testid="start-stream"]');
    await page.waitForWebSocket('model.state.changed');
    
    // Verify STREAMING state menu
    await expect(page.locator('[data-testid="stop-stream"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-stream"]')).not.toBeVisible();
    
    // Join queue
    await page.click('[data-testid="join-queue"]');
    await page.waitForWebSocket('model.queue.updated');
    
    // Verify STREAM_IN_QUEUE state menu
    await expect(page.locator('[data-testid="queue-position"]')).toBeVisible();
    await expect(page.locator('[data-testid="leave-queue"]')).toBeVisible();
    
    // Performance assigned
    await simulatePerformanceAssignment();
    await page.waitForWebSocket('model.performance.started');
    
    // Verify STREAM_PERFORMING state menu
    await expect(page.locator('[data-testid="performance-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="leave-queue"]')).not.toBeEnabled();
  });
  
  it('should persist menu preferences across sessions', async () => {
    // Login and customize menu
    await page.login(modelCredentials);
    await page.click('[data-testid="menu-settings"]');
    await page.click('[data-testid="pin-action-join-queue"]');
    await page.click('[data-testid="save-preferences"]');
    
    // Verify quick action pinned
    await expect(page.locator('[data-testid="quick-action-join-queue"]')).toBeVisible();
    
    // Logout and login again
    await page.logout();
    await page.login(modelCredentials);
    
    // Verify preference persisted
    await expect(page.locator('[data-testid="quick-action-join-queue"]')).toBeVisible();
  });
});
```

### Security Testing

#### Authentication/Authorization Tests

```typescript
describe('Menu Security', () => {
  it('should deny access without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/model/menu')
      .expect(401);
  });
  
  it('should deny access with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/model/menu')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
  
  it('should hide admin sections from non-admin models', async () => {
    const menu = await service.getMenuForModel(regularModelId);
    expect(menu.sections.find(s => s.id === 'admin')).toBeUndefined();
  });
  
  it('should enforce rate limits on action triggers', async () => {
    // Trigger action multiple times
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/queue/join')
        .set('Authorization', `Bearer ${modelToken}`)
        .send({ idempotencyKey: `key-${i}` });
    }
    
    // 11th attempt should be rate limited
    const response = await request(app.getHttpServer())
      .post('/api/v1/queue/join')
      .set('Authorization', `Bearer ${modelToken}`)
      .send({ idempotencyKey: 'key-11' })
      .expect(429);
    
    expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### Performance Testing

#### Load Tests

```typescript
describe('Menu Performance', () => {
  it('should handle 1000 concurrent menu requests', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 1000 }, (_, i) => 
      request(app.getHttpServer())
        .get('/api/v1/model/menu')
        .set('Authorization', `Bearer ${modelTokens[i]}`)
    );
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    // All requests should succeed
    responses.forEach(res => expect(res.status).toBe(200));
    
    // Should complete within 5 seconds
    expect(duration).toBeLessThan(5000);
  });
  
  it('should cache menu structure for repeated requests', async () => {
    // First request (cache miss)
    const start1 = Date.now();
    await service.getMenuForModel(modelId);
    const duration1 = Date.now() - start1;
    
    // Second request (cache hit)
    const start2 = Date.now();
    await service.getMenuForModel(modelId);
    const duration2 = Date.now() - start2;
    
    // Cached request should be significantly faster
    expect(duration2).toBeLessThan(duration1 * 0.5);
  });
});
```

---

## Appendix: Menu Item Registry

### Complete Menu Item Definitions

```typescript
const MENU_ITEMS: Record<string, MenuItemDefinition> = {
  // Streaming Controls
  'start-stream': {
    id: 'start-stream',
    label: 'Start Stream',
    icon: 'video',
    action: 'startStream',
    requiredState: ['IDLE'],
    requiredPermissions: ['STREAM'],
    section: 'streaming'
  },
  'stop-stream': {
    id: 'stop-stream',
    label: 'Stop Stream',
    icon: 'video-off',
    action: 'stopStream',
    requiredState: ['STREAMING', 'STREAM_IN_QUEUE'],
    prohibitedState: ['STREAM_PERFORMING'],
    requiredPermissions: ['STREAM'],
    section: 'streaming'
  },
  
  // Queue Management
  'join-queue': {
    id: 'join-queue',
    label: 'Join Queue',
    icon: 'list',
    action: 'joinQueue',
    requiredState: ['IDLE', 'STREAMING'],
    prohibitedState: ['IN_QUEUE', 'PERFORMING', 'STREAM_IN_QUEUE', 'STREAM_PERFORMING'],
    requiredPermissions: ['JOIN_QUEUE'],
    section: 'queue'
  },
  'leave-queue': {
    id: 'leave-queue',
    label: 'Leave Queue',
    icon: 'x',
    action: 'leaveQueue',
    requiredState: ['IN_QUEUE', 'STREAM_IN_QUEUE'],
    prohibitedState: ['PERFORMING', 'STREAM_PERFORMING'],
    requiredPermissions: ['LEAVE_QUEUE'],
    section: 'queue'
  },
  
  // Financial Management
  'view-balance': {
    id: 'view-balance',
    label: 'Balance',
    icon: 'wallet',
    action: 'viewBalance',
    requiredPermissions: ['READ_WALLET'],
    section: 'financial'
  },
  'request-payout': {
    id: 'request-payout',
    label: 'Request Payout',
    icon: 'dollar',
    action: 'requestPayout',
    requiredPermissions: ['REQUEST_PAYOUT'],
    section: 'financial',
    rateLimit: {
      max: 3,
      window: 86400000  // 1 day
    }
  },
  
  // Settings
  'set-mood': {
    id: 'set-mood',
    label: 'Set Mood',
    icon: 'emoji',
    action: 'setMood',
    requiredState: ['STREAMING', 'STREAM_IN_QUEUE', 'STREAM_PERFORMING'],
    requiredPermissions: ['UPDATE_MOOD'],
    section: 'settings'
  },
  
  // Always Available
  'dashboard': {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    action: 'navigateDashboard',
    requiredPermissions: [],
    section: 'navigation'
  },
  'help': {
    id: 'help',
    label: 'Help',
    icon: 'question',
    action: 'openHelp',
    requiredPermissions: [],
    section: 'support'
  }
};
```

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | XXXChatNow Engineering | Initial specification |

**Review Schedule**: Quarterly or after significant platform changes

**Approval Required From**:
- Engineering Lead
- Security Team
- Product Owner

**Related Documents**:
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [COPILOT_GOVERNANCE.md](COPILOT_GOVERNANCE.md)
- [PERFORMANCE_QUEUE_ARCHITECTURE.md](PERFORMANCE_QUEUE_ARCHITECTURE.md)
- [XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)
- [MODEL_MOOD_RESPONSE_SYSTEM.md](MODEL_MOOD_RESPONSE_SYSTEM.md)

---

**END OF SPECIFICATION**
