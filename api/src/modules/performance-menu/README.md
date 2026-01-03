# Performance Menu Module

## Overview

The Performance Menu Module implements a structured way for models to offer interactive experiences through purchasable menu items. This module handles menu management, item purchases, and integrates with the token system and performance queue.

## Architecture Reference

This module implements the specifications defined in:
- `MODEL_PERFORMANCE_MENU.md` (root of repository)
- `PERFORMANCE_QUEUE_ARCHITECTURE.md`
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- `COPILOT_GOVERNANCE.md`

## Features

### Menu Management
- Create and manage performance menus
- Support for multiple menus per model
- Menu item categorization and ordering
- Theme customization support

### Purchasing System
- **Queue OFF Mode**: Immediate token transfers for real-time interactions
- **Queue ON Mode**: Escrow-based system with performance queue integration
- Server-side validation and security
- Idempotency support to prevent duplicate purchases
- Daily purchase limits per item

### Access Control
- **Public**: Available to all users
- **Subscribers Only**: Requires active subscription
- **Private**: Whitelist-based access control

### Security Features
- Authentication required for all endpoints
- Server-side pricing enforcement (no client-side trust)
- Balance verification before purchase
- Atomic database transactions
- Complete audit trail
- Rate limiting support (future enhancement)

## Module Structure

```
performance-menu/
├── performance-menu.module.ts      # NestJS module definition
├── index.ts                        # Module exports
├── controllers/                    # REST API endpoints
│   ├── performance-menu.controller.ts
│   └── index.ts
├── services/                       # Business logic
│   ├── performance-menu.service.ts
│   └── index.ts
├── schemas/                        # MongoDB schemas
│   ├── menu.schema.ts
│   ├── menu-item.schema.ts
│   ├── menu-purchase.schema.ts
│   └── index.ts
└── dtos/                          # Data Transfer Objects
    ├── purchase-menu-item.dto.ts
    └── index.ts
```

## Database Schemas

### Menu Item
- Represents individual purchasable items
- Fields: name, description, token_value, bonus_loyalty_points, lovense_activation, etc.
- Lovense activation support with timing and intensity controls

### Menu
- Represents a collection of menu items for a model
- Fields: name, model_id, menu_items[], queue_mode, visibility, theme
- Supports queue mode configuration (ON/OFF)
- Visibility controls (public, subscribers_only, private)

### Menu Purchase
- Complete transaction record with audit trail
- Fields: purchase_id, user_id, model_id, token_value, status, etc.
- Tracks both immediate and queued transactions
- Idempotency key support

## API Endpoints

All endpoints require JWT authentication.

### GET /menu/:menuId
Get menu details with access control checks.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Quick Fun Menu",
  "model_id": "507f1f77bcf86cd799439010",
  "queue_mode": "OFF",
  "visibility": "public",
  "menu_items": [...]
}
```

### GET /menu/model/:modelId
Get all active menus for a specific model.

### POST /menu/purchase
Purchase a menu item.

**Request Body:**
```json
{
  "menu_id": "507f1f77bcf86cd799439011",
  "menu_item_id": "507f1f77bcf86cd799439012",
  "idempotency_key": "unique-key-123"
}
```

**Response (Queue OFF):**
```json
{
  "success": true,
  "purchase_id": "uuid-v4",
  "transaction_type": "immediate",
  "status": "completed",
  "token_value": 50,
  "loyalty_points_awarded": 30
}
```

**Response (Queue ON):**
```json
{
  "success": true,
  "purchase_id": "uuid-v4",
  "transaction_type": "queued",
  "status": "pending",
  "token_value": 200,
  "loyalty_points_awarded": 150,
  "queue_position": 3,
  "estimated_wait_minutes": 45
}
```

### GET /menu/purchase/history
Get user's purchase history with pagination.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

### GET /menu/purchase/:purchaseId/status
Get status of a specific purchase.

## Queue Modes

### Queue OFF (Immediate Transfer)
1. User initiates purchase
2. Server validates authentication, balance, and item availability
3. Tokens immediately transferred from user to model
4. Loyalty points awarded
5. Purchase record created with status "completed"
6. Lovense activation triggered if configured
7. Response returned to user

**Use Cases:**
- Live streaming interactions
- Real-time requests
- Immediate digital content delivery

### Queue ON (Escrow Mode)
1. User initiates purchase
2. Server validates authentication, balance, and item availability
3. Tokens deducted from user and held in escrow
4. Request added to performance queue
5. Purchase record created with status "pending"
6. Model performs requested action
7. Model marks item as complete (future implementation)
8. Tokens released to model
9. Status updated to "completed"

**Use Cases:**
- Offline requests
- Custom content creation
- Scheduled performances
- Actions requiring preparation

## Security Considerations

### Critical Security Requirements

✅ **Server-Side Validation**: All pricing and calculations performed on backend
✅ **Authentication Required**: All endpoints protected by JWT authentication
✅ **Balance Verification**: User balance checked before accepting purchase
✅ **Atomic Transactions**: Database transactions ensure consistency
✅ **Audit Trail**: Complete logging of all transactions
✅ **Idempotency**: Prevent duplicate purchases with idempotency keys

### Prohibited Actions

❌ **NEVER** allow client to specify token amounts
❌ **NEVER** bypass balance checks
❌ **NEVER** process purchases without authentication
❌ **NEVER** log sensitive user data
❌ **NEVER** allow race conditions in concurrent purchases

## Integration Points

### Current Integrations
- **User Module**: Authentication and balance management
- **Wallet Module**: Token balance queries

### Future Integrations (Planned)
- **Performance Queue Module**: Queue management for escrow transactions
- **Loyalty Points Module**: Bonus point awards
- **Subscription Module**: Subscriber-only menu access verification
- **Lovense Integration**: Device activation on purchase
- **Notification Module**: Purchase confirmations and queue updates

## Development Status

### Completed ✅
- ✅ Database schemas (Menu, MenuItem, MenuPurchase)
- ✅ Service layer with purchasing logic
- ✅ Queue OFF mode (immediate transfers)
- ✅ Queue ON mode (escrow framework)
- ✅ REST API endpoints
- ✅ Access control (visibility modes)
- ✅ Idempotency support
- ✅ Daily purchase limits
- ✅ Swagger/OpenAPI documentation

### Pending 🔄
- 🔄 Integration with Performance Queue module
- 🔄 Integration with Loyalty Points module
- 🔄 Subscription verification for subscribers_only menus
- 🔄 Lovense device activation
- 🔄 Rate limiting
- 🔄 Unit tests
- 🔄 Integration tests
- 🔄 Admin endpoints for model menu management
- 🔄 Queue completion workflow (model confirms delivery)

## Testing

Tests should cover:
- Menu access control (visibility modes)
- Purchase validation (balance, authentication, limits)
- Idempotency enforcement
- Atomic transaction handling
- Queue mode switching
- Error handling

## Usage Example

```typescript
// In another module
import { PerformanceMenuService } from '../performance-menu';

constructor(
  private readonly menuService: PerformanceMenuService
) {}

async purchaseItem(userId: ObjectId) {
  const result = await this.menuService.purchaseMenuItem(userId, {
    menu_id: 'menu-id',
    menu_item_id: 'item-id',
    idempotency_key: 'unique-key'
  });
  
  console.log(`Purchase ${result.purchase_id} completed`);
}
```

## Seed Data

Template menus are available in:
- `api/seed/performanceMenuTemplates.json`

This file contains three complete menu templates:
1. Quick Fun Menu (immediate, low-cost items)
2. Private Energy Menu (queued, custom content)
3. VIP Experience Menu (subscribers-only, premium items)

---

**Last Updated**: 2026-01-02
**Version**: 1.0.0
