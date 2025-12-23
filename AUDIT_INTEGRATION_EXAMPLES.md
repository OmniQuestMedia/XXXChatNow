# Audit Logging Integration Examples

This document provides practical examples of how to integrate audit logging into user and admin applications.

## User Application Examples

### Example 1: Slot Machine Spin

```typescript
// user/pages/games/slot-machine.tsx
import { logAuditEvent } from '@/utils/audit';
import { slotMachineService } from '@/services';

const SlotMachinePage = () => {
  const handleSpin = async (betAmount: number) => {
    try {
      // Log audit event BEFORE executing the operation
      await logAuditEvent(
        'slot-machine-spin',
        'games',
        { 
          gameType: 'standard' // Non-sensitive metadata only
        }
      );

      // Execute the actual spin operation
      const result = await slotMachineService.spin({
        betAmount,
        idempotencyKey: generateIdempotencyKey()
      });

      // Handle result...
      showResult(result);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      <SlotMachine onSpin={handleSpin} />
    </div>
  );
};
```

### Example 2: Wheel Spin

```typescript
// user/components/wheel/wheel-popup.tsx
import { logAuditEvent } from '@/utils/audit';
import { wheelService } from '@/services';

const handleWheelSpin = async (wheelId: string) => {
  // Audit the spin attempt
  await logAuditEvent(
    'wheel-spin',
    'games',
    { 
      wheelType: 'daily' // Generic metadata, not specific IDs
    }
  );

  // Execute the spin
  const result = await wheelService.spin(wheelId);
  return result;
};
```

### Example 3: Point Redemption

```typescript
// user/pages/loyalty/redeem.tsx
import { logAuditEvent } from '@/utils/audit';
import { loyaltyService } from '@/services';

const handleRedeemPoints = async (rewardId: string, points: number) => {
  // Audit the redemption
  await logAuditEvent(
    'redeem-points',
    'loyalty',
    { 
      rewardType: 'premium' // Category, not exact values
    }
  );

  // Execute redemption
  const result = await loyaltyService.redeem(rewardId, points);
  return result;
};
```

## Admin Application Examples

### Example 1: User Suspension

```typescript
// admin/pages/users/manage.tsx
import { logAuditEvent } from '@/utils/audit';
import { userService } from '@/services';

const handleSuspendUser = async (userId: string, reason: string) => {
  try {
    // Audit the admin action FIRST
    await logAuditEvent(
      'admin-suspend-user',
      'admin-users',
      {
        action: 'suspend',
        reason: 'policy-violation' // Generic reason, not details
      }
    );

    // Execute the suspension
    await userService.suspendUser(userId, reason);
    
    message.success('User suspended successfully');
  } catch (error) {
    message.error('Failed to suspend user');
  }
};
```

### Example 2: Payout Approval

```typescript
// admin/pages/payouts/review.tsx
import { logAuditEvent } from '@/utils/audit';
import { payoutService } from '@/services';

const handleApprovePayout = async (payoutId: string) => {
  // Audit the approval
  await logAuditEvent(
    'admin-approve-payout',
    'admin-payouts',
    {
      action: 'approve',
      method: 'wire-transfer' // Payment method type only
    }
  );

  // Process the approval
  await payoutService.approve(payoutId);
};

const handleRejectPayout = async (payoutId: string, reason: string) => {
  // Audit the rejection
  await logAuditEvent(
    'admin-reject-payout',
    'admin-payouts',
    {
      action: 'reject',
      category: 'documentation' // Rejection category, not specific reason
    }
  );

  // Process the rejection
  await payoutService.reject(payoutId, reason);
};
```

### Example 3: Configuration Change

```typescript
// admin/pages/settings/payment.tsx
import { logAuditEvent } from '@/utils/audit';
import { settingService } from '@/services';

const handleUpdatePaymentConfig = async (config: PaymentConfig) => {
  // Audit config change
  await logAuditEvent(
    'admin-update-config',
    'admin-settings',
    {
      section: 'payment',
      changeType: 'gateway-settings' // Type of change, not values
    }
  );

  // Apply configuration
  await settingService.update('payment', config);
};
```

## What NOT to Include in Audit Logs

### ❌ Bad Examples (DO NOT DO THIS)

```typescript
// BAD: Logs sensitive user data
await logAuditEvent('user-update', 'profile', {
  email: 'user@example.com',  // ❌ PII
  name: 'John Doe',            // ❌ PII
  balance: 1234.56             // ❌ Financial data
});

// BAD: Logs financial details
await logAuditEvent('payout-approved', 'admin-payouts', {
  amount: 5000,                // ❌ Exact amount
  userId: '507f1f77bcf86cd',  // ❌ User ID
  accountNumber: 'xxx1234'     // ❌ Payment details
});

// BAD: Logs authentication data
await logAuditEvent('login-attempt', 'auth', {
  password: 'secret123',       // ❌ Credentials
  token: 'Bearer abc123...',   // ❌ Auth tokens
  sessionId: 'xyz789'          // ❌ Session identifiers
});
```

### ✅ Good Examples (DO THIS)

```typescript
// GOOD: Generic operation metadata only
await logAuditEvent('user-update', 'profile', {
  section: 'preferences',      // ✅ Section updated
  changeType: 'privacy'        // ✅ Type of change
});

// GOOD: Operation type without specifics
await logAuditEvent('payout-approved', 'admin-payouts', {
  method: 'bank-transfer',     // ✅ Payment method type
  status: 'approved'           // ✅ Operation result
});

// GOOD: Action tracking without sensitive data
await logAuditEvent('login-attempt', 'auth', {
  result: 'success',           // ✅ Operation result
  method: '2fa'                // ✅ Auth method used
});
```

## Menu Integration Pattern

### User Menu Example

```typescript
// user/components/common/layout/menu.tsx
import { logAuditEvent } from '@/utils/audit';

const SiderMenu = ({ menus, onClick }) => {
  const handleMenuClick = async (menuItem) => {
    // Only audit sensitive menu actions
    if (isSensitiveMenuAction(menuItem.id)) {
      await logAuditEvent(
        `menu-${menuItem.id}`,
        menuItem.id,
        {
          category: menuItem.category
        }
      );
    }

    // Execute menu action
    onClick(menuItem);
  };

  // Helper to determine if menu action is sensitive
  const isSensitiveMenuAction = (menuId: string) => {
    const sensitiveMenus = [
      'games',
      'loyalty',
      'token-purchase',
      'payout-request',
      'account-settings'
    ];
    return sensitiveMenus.includes(menuId);
  };

  return (
    <Menu onClick={handleMenuClick}>
      {/* Menu items */}
    </Menu>
  );
};
```

### Admin Menu Example

```typescript
// admin/components/common/layout/menu.tsx
import { logAuditEvent } from '@/utils/audit';

const AdminMenu = ({ menus, onClick }) => {
  const handleAdminMenuClick = async (menuItem) => {
    // All admin menu actions are sensitive
    await logAuditEvent(
      `admin-menu-${menuItem.id}`,
      menuItem.id,
      {
        section: menuItem.section
      }
    );

    // Execute admin action
    onClick(menuItem);
  };

  return (
    <Menu onClick={handleAdminMenuClick}>
      {/* Admin menu items */}
    </Menu>
  );
};
```

## Error Handling

The audit utility includes built-in error handling that logs failures but doesn't block operations:

```typescript
// The logAuditEvent function handles errors gracefully
export async function logAuditEvent(
  action: string,
  menuKey?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await auditService.logEvent(action, menuKey, metadata);
  } catch (error) {
    // Error is logged but doesn't throw
    // Operation can continue even if audit logging fails
    console.error('Failed to log audit event:', error);
  }
}
```

This ensures that:
- User operations aren't blocked by audit API failures
- Audit failures are logged for monitoring
- Application remains functional during audit service outages

## Testing Audit Integration

### Manual Testing

```bash
# Start the API server
cd api
yarn dev

# Start user app
cd user
yarn dev

# Test audit endpoint directly
curl -X POST http://localhost:8080/api/audit/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "test-action",
    "menuKey": "test-menu",
    "metadata": {"test": true}
  }'
```

### Integration Testing

```typescript
// Example test for audit integration
describe('Slot Machine with Audit', () => {
  it('should log audit event before spin', async () => {
    const auditSpy = jest.spyOn(auditService, 'logEvent');
    
    await handleSlotMachineSpin(10);
    
    expect(auditSpy).toHaveBeenCalledWith(
      'slot-machine-spin',
      'games',
      expect.any(Object)
    );
  });
});
```

## References

- [User README](../user/README.md) - User app audit requirements
- [Admin README](../admin/README.md) - Admin app audit requirements  
- [DECISIONS.md](../DECISIONS.md) - Audit policy and requirements
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) - Security guidelines
