# Merge Conflict Resolution Guide

## Conflict Summary

When merging `copilot/split-specification-into-files` with `feature/model-mood-messaging-system`, there will be conflicts in `api/src/app.module.ts`.

## Conflict Details

**Location 1: Import statements (around line 48-51)**

```typescript
// Current branch (copilot/split-specification-into-files)
import { WalletModule } from './modules/wallet/wallet.module';
import { MoodMessagingModule } from './modules/mood-messaging/mood-messaging.module';

// Other branch (feature/model-mood-messaging-system)
import { WalletModule } from './modules/wallet/wallet.module';
import { PerformanceMenuModule } from './modules/performance-menu/performance-menu.module';
import { MoodMessageModule } from './modules/mood-message/mood-message.module';
```

**Location 2: Module imports array (around line 96-103)**

```typescript
// Current branch (copilot/split-specification-into-files)
    PerformanceQueueModule,
    WalletModule,
    MoodMessagingModule
  ],

// Other branch (feature/model-mood-messaging-system)
    PerformanceQueueModule,
    WalletModule,
    PerformanceMenuModule,
    MoodMessageModule
  ],
```

## Resolution Strategy

### Keep ALL modules from both branches

The conflict arises because both branches are adding different mood messaging implementations:
- **My branch** adds: `MoodMessagingModule` (comprehensive mood messaging system)
- **Other branch** adds: `PerformanceMenuModule` and `MoodMessageModule`

### Recommended Resolution

**Step 1: Resolve import statements**
```typescript
import { PerformanceQueueModule } from './modules/performance-queue/performance-queue.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MoodMessagingModule } from './modules/mood-messaging/mood-messaging.module';
import { PerformanceMenuModule } from './modules/performance-menu/performance-menu.module';
import { MoodMessageModule } from './modules/mood-message/mood-message.module';
```

**Step 2: Resolve module imports array**
```typescript
    LoyaltyPointsModule,
    PerformanceQueueModule,
    WalletModule,
    MoodMessagingModule,
    PerformanceMenuModule,
    MoodMessageModule
  ],
```

## Verification After Merge

After resolving the conflicts, verify:

1. **Check all modules exist:**
   ```bash
   ls -la api/src/modules/mood-messaging
   ls -la api/src/modules/performance-menu
   ls -la api/src/modules/mood-message
   ```

2. **Verify TypeScript compilation:**
   ```bash
   cd api
   yarn build
   ```

3. **Run tests:**
   ```bash
   cd api
   yarn test
   ```

4. **Check for duplicate functionality:**
   - Review if `MoodMessageModule` and `MoodMessagingModule` overlap
   - If they provide similar functionality, coordinate with the team to determine which to keep or how to integrate them

## Alternative: Rename Strategy

If the modules have conflicting or overlapping functionality, consider:

1. **Rename for clarity:**
   - Keep `MoodMessagingModule` (my comprehensive implementation)
   - Rename or remove `MoodMessageModule` if redundant
   - Keep `PerformanceMenuModule` if it's unrelated

2. **Consolidate if appropriate:**
   - Merge functionality from both mood messaging implementations
   - Keep the most complete/tested implementation as the base

## Notes

- Both branches are adding legitimate functionality
- The merge conflict is expected and normal
- All three modules can coexist if they serve different purposes
- Review with the team if functionality overlaps
