# Model Performance Menu System

## Overview

The Model Performance Menu System provides a structured way for models to offer interactive experiences to users through purchasable menu items. This system integrates real-time token transactions with optional performance queue management and Lovense device activation.

## Real-Time Token Sales Principles

### Core Principles

1. **Deterministic Pricing**: All token values are defined server-side and cannot be manipulated by clients
2. **Server-Side Validation**: All purchase validations occur on the backend
3. **Transparent Transactions**: Users see clear pricing before purchase
4. **Audit Trail**: Complete logging of all transactions for accountability
5. **Balance Verification**: User balance is checked before processing purchases

### Transaction Flow

```
User Initiates Purchase
    ↓
Server Validates Request (Auth, Balance, Item Availability)
    ↓
Transaction Mode Check
    ↓
├─→ Queue OFF: Immediate Token Transfer
│   ├─ Deduct tokens from user
│   ├─ Credit tokens to model
│   ├─ Log transaction
│   └─ Return success response
│
└─→ Queue ON: Escrow Until Performance
    ├─ Deduct tokens from user
    ├─ Place tokens in escrow
    ├─ Add to performance queue
    ├─ Log transaction with escrow status
    └─ Return success with queue position
```

## UI Specifications

### Menu Display

**Layout Requirements:**
- Responsive grid layout (2 columns on mobile, 3-4 on desktop)
- Clear item cards with hover effects
- Prominent pricing display
- Visual indicators for queue status
- Real-time availability updates

**Menu Item Card:**
```
┌─────────────────────────────────┐
│  [Item Icon/Image]              │
│                                 │
│  Item Name                      │
│  Brief description...           │
│                                 │
│  💎 [Token Amount] Tokens       │
│  ⭐ +[Loyalty Points] LP        │
│                                 │
│  [Status Badge]                 │
│  [Purchase Button]              │
└─────────────────────────────────┘
```

**Status Indicators:**
- 🟢 Available Now (Queue OFF)
- 🟡 Queue Active (Estimated wait time)
- 🔴 Currently Unavailable
- 💝 Lovense Enhanced (with icon)

### Purchase Flow

1. **User Views Menu**: Display all available items with clear pricing
2. **User Selects Item**: Shows confirmation modal with details
3. **Confirmation Modal**:
   - Item name and description
   - Token cost (bold, prominent)
   - Bonus loyalty points
   - Current balance → New balance
   - Queue status (if applicable)
   - Lovense activation details (if applicable)
   - Confirm/Cancel buttons
4. **Transaction Processing**: Loading state with progress indicator
5. **Success Feedback**:
   - Success message with transaction details
   - New balance display
   - Queue position (if applicable)
   - Expected delivery time

### Queue Status Display

When Queue Mode is ON:
```
Your Position: #[N] in queue
Estimated Wait: [X] minutes
Status: [Pending/Processing/Complete]

[View Queue Details Button]
```

## Menu Item Schema

### MenuItem Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | ObjectId | Yes | Unique identifier |
| `name` | String | Yes | Display name of the menu item |
| `description` | String | Yes | Detailed description |
| `token_value` | Number | Yes | Cost in tokens (server-defined) |
| `bonus_loyalty_points` | Number | No | Bonus points awarded (default: 0) |
| `lovense_activation` | Object | No | Lovense device configuration |
| `is_active` | Boolean | Yes | Whether item is available for purchase |
| `display_order` | Number | Yes | Sort order in menu display |
| `category` | String | No | Category for grouping items |
| `icon_url` | String | No | URL to item icon/image |
| `max_daily_purchases` | Number | No | Limit per user per day |
| `created_at` | Date | Yes | Creation timestamp |
| `updated_at` | Date | Yes | Last update timestamp |

### Lovense Activation Object

```typescript
{
  enabled: boolean,
  device_type: string,  // 'vibrator', 'pump', 'all'
  intensity: number,    // 1-20 scale
  duration_ms: number,  // Duration in milliseconds
  timing_offset: number, // Delay before activation (ms)
  pattern: string       // Optional: 'pulse', 'wave', 'steady'
}
```

**Example:**
```json
{
  "enabled": true,
  "device_type": "vibrator",
  "intensity": 15,
  "duration_ms": 10000,
  "timing_offset": 1000,
  "pattern": "pulse"
}
```

## Menu Schema

### Menu Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | ObjectId | Yes | Unique identifier |
| `name` | String | Yes | Menu name (e.g., "Quick Fun Menu") |
| `model_id` | ObjectId | Yes | Reference to performer/model |
| `menu_items` | Array<ObjectId> | Yes | References to MenuItem documents |
| `is_active` | Boolean | Yes | Whether menu is currently active |
| `queue_mode` | String | Yes | 'ON' or 'OFF' |
| `visibility` | String | Yes | 'public', 'subscribers_only', 'private' |
| `theme` | Object | No | UI theme customization |
| `created_at` | Date | Yes | Creation timestamp |
| `updated_at` | Date | Yes | Last update timestamp |

## Queue Modes

### Queue OFF Mode

**Behavior:**
- Immediate token transfer from user to model
- No escrow or waiting period
- Instant transaction completion
- Model is expected to deliver service in real-time

**Use Cases:**
- Live streaming interactions
- Real-time requests during active show
- Immediate digital content delivery

**Implementation:**
```typescript
// Pseudo-code for Queue OFF
async purchaseMenuItem(userId, menuItemId) {
  const user = await validateUser(userId);
  const item = await getMenuItem(menuItemId);
  
  // Check balance
  if (user.tokenBalance < item.token_value) {
    throw new InsufficientBalanceError();
  }
  
  // Immediate transfer
  await atomicTransaction(async () => {
    await deductTokens(userId, item.token_value);
    await creditTokens(item.model_id, item.token_value);
    await awardLoyaltyPoints(userId, item.bonus_loyalty_points);
    await logTransaction(userId, item.model_id, item.token_value, 'immediate');
  });
  
  // Trigger Lovense if configured
  if (item.lovense_activation?.enabled) {
    await triggerLovense(item.model_id, item.lovense_activation);
  }
  
  return { success: true, transaction_type: 'immediate' };
}
```

### Queue ON Mode

**Behavior:**
- Tokens deducted from user immediately
- Tokens held in escrow until model performs action
- Request added to performance queue
- Model marks items as complete when performed
- Tokens released to model upon completion

**Use Cases:**
- Offline requests (model not currently streaming)
- Scheduled performances
- Content creation requests
- Actions requiring preparation time

**Implementation:**
```typescript
// Pseudo-code for Queue ON
async purchaseMenuItem(userId, menuItemId) {
  const user = await validateUser(userId);
  const item = await getMenuItem(menuItemId);
  
  // Check balance
  if (user.tokenBalance < item.token_value) {
    throw new InsufficientBalanceError();
  }
  
  // Escrow transaction
  await atomicTransaction(async () => {
    await deductTokens(userId, item.token_value);
    await createEscrowEntry(userId, item.model_id, item.token_value);
    
    const queueEntry = await addToPerformanceQueue({
      user_id: userId,
      model_id: item.model_id,
      menu_item_id: menuItemId,
      token_value: item.token_value,
      status: 'pending',
      created_at: new Date()
    });
    
    await awardLoyaltyPoints(userId, item.bonus_loyalty_points);
    await logTransaction(userId, item.model_id, item.token_value, 'escrow', queueEntry.id);
  });
  
  return { 
    success: true, 
    transaction_type: 'queued',
    queue_position: queueEntry.position,
    estimated_wait_minutes: calculateEstimatedWait(queueEntry.position)
  };
}
```

## Visibility Integrity

### Visibility Modes

1. **Public**: Visible to all users
2. **Subscribers Only**: Visible only to users who have subscribed to the model
3. **Private**: Visible only to specific users (whitelist)

### Access Control

**Server-Side Enforcement:**
```typescript
async getMenuForUser(menuId, userId) {
  const menu = await Menu.findById(menuId);
  const user = await User.findById(userId);
  
  // Check visibility
  switch (menu.visibility) {
    case 'public':
      return menu;
    
    case 'subscribers_only':
      const hasSubscription = await checkSubscription(userId, menu.model_id);
      if (!hasSubscription) {
        throw new UnauthorizedError('Subscription required');
      }
      return menu;
    
    case 'private':
      const isWhitelisted = await checkWhitelist(userId, menu.id);
      if (!isWhitelisted) {
        throw new UnauthorizedError('Access denied');
      }
      return menu;
    
    default:
      throw new Error('Invalid visibility mode');
  }
}
```

## Security Requirements

### Critical Security Measures

1. **Server-Side Validation**: All pricing and calculations performed on backend
2. **Authentication Required**: All endpoints require valid authentication tokens
3. **Balance Verification**: Check user balance before accepting purchase
4. **Idempotency**: Prevent duplicate purchases with idempotency keys
5. **Rate Limiting**: Limit purchase frequency per user
6. **Audit Logging**: Complete transaction history with timestamps
7. **No Client-Side Trust**: Never trust client-provided pricing or calculations
8. **Atomic Transactions**: Use database transactions for consistency
9. **Authorization Checks**: Verify user has permission to view/purchase from menu
10. **Input Sanitization**: Validate and sanitize all user inputs

### Prohibited Actions

❌ **NEVER** allow client to specify token amounts
❌ **NEVER** bypass balance checks
❌ **NEVER** process purchases without authentication
❌ **NEVER** log sensitive user data (beyond transaction IDs)
❌ **NEVER** allow race conditions in concurrent purchases

## Integration with Performance Queue

The menu system integrates with the existing Performance Queue module (see `PERFORMANCE_QUEUE_ARCHITECTURE.md`):

- Queue requests created with type `menu.purchase`
- Priority based on token value (higher value = higher priority)
- Escrow system prevents token loss if queue item fails
- Dead Letter Queue (DLQ) for failed performance requests
- Health monitoring for queue status

## Sample Menu Templates

See `seed/performanceMenuTemplates.json` for complete templates including:
- Quick Fun Menu (immediate, low-cost items)
- Private Energy Menu (higher value, queue-based items)
- VIP Experience Menu (premium, subscribers-only items)

## API Endpoints (To Be Implemented)

```
POST   /api/menu/purchase          - Purchase a menu item
GET    /api/menu/:menuId            - Get menu details
GET    /api/menu/:menuId/items      - Get menu items
GET    /api/menu/model/:modelId     - Get model's active menus
GET    /api/menu/purchase/history   - Get user's purchase history
POST   /api/menu/queue/:queueId/complete - Model marks queue item complete (admin)
GET    /api/menu/queue/status/:queueId   - Get queue item status
```

---

**References:**
- `PERFORMANCE_QUEUE_ARCHITECTURE.md` - Queue system architecture
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md` - Security requirements
- `COPILOT_GOVERNANCE.md` - Governance standards
- `WALLET_MODULE_IMPLEMENTATION_SUMMARY.md` - Token transaction patterns
