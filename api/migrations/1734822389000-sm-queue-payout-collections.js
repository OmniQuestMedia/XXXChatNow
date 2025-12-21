/**
 * Migration: Create SM (Slot Machine) Queue and Payout Collections
 * 
 * Creates indexes and initial configuration for:
 * - SM-Queue-Entry: User queues per model
 * - SM-Game-Session: Active game sessions
 * - SM-Payout-Transaction: Token debit/credit records
 * 
 * Date: 2025-12-21
 */

const { ObjectId } = require('mongodb');

module.exports.up = async function up(db) {
  console.log('Creating SM (Slot Machine) queue and payout collections...');

  // 1. Create sm_queue_entries collection with indexes
  await db.createCollection('sm_queue_entries');
  await db.collection('sm_queue_entries').createIndexes([
    { key: { queueId: 1 }, unique: true },
    { key: { idempotencyKey: 1 }, unique: true },
    { key: { userId: 1 }, name: 'userId_idx' },
    { key: { performerId: 1 }, name: 'performerId_idx' },
    { key: { status: 1 }, name: 'status_idx' },
    { key: { performerId: 1, status: 1, position: 1 }, name: 'queue_lookup_idx' },
    { key: { userId: 1, status: 1, createdAt: -1 }, name: 'user_history_idx' },
    { key: { status: 1, expiresAt: 1 }, name: 'expiration_idx' },
    { key: { createdAt: 1, archived: 1 }, name: 'archival_idx' }
  ]);
  console.log('✓ Created sm_queue_entries collection');

  // 2. Create sm_game_sessions collection with indexes
  await db.createCollection('sm_game_sessions');
  await db.collection('sm_game_sessions').createIndexes([
    { key: { sessionId: 1 }, unique: true },
    { key: { userId: 1 }, name: 'userId_idx' },
    { key: { performerId: 1 }, name: 'performerId_idx' },
    { key: { queueId: 1 }, name: 'queueId_idx' },
    { key: { status: 1 }, name: 'status_idx' },
    { key: { performerId: 1, status: 1 }, name: 'active_session_idx' },
    { key: { userId: 1, status: 1, startedAt: -1 }, name: 'user_sessions_idx' },
    { key: { status: 1, completedAt: 1 }, name: 'analytics_idx' },
    { key: { createdAt: 1, archived: 1 }, name: 'archival_idx' }
  ]);

  // Partial unique index: Only one active session per performer
  await db.collection('sm_game_sessions').createIndex(
    { performerId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        status: { $in: ['initializing', 'active'] }
      },
      name: 'one_active_per_performer_idx'
    }
  );
  console.log('✓ Created sm_game_sessions collection');

  // 3. Create sm_payout_transactions collection with indexes
  await db.createCollection('sm_payout_transactions');
  await db.collection('sm_payout_transactions').createIndexes([
    { key: { transactionId: 1 }, unique: true },
    { key: { idempotencyKey: 1 }, unique: true },
    { key: { userId: 1 }, name: 'userId_idx' },
    { key: { performerId: 1 }, name: 'performerId_idx' },
    { key: { type: 1 }, name: 'type_idx' },
    { key: { status: 1 }, name: 'status_idx' },
    { key: { userId: 1, type: 1, createdAt: -1 }, name: 'user_transactions_idx' },
    { key: { performerId: 1, type: 1, createdAt: -1 }, name: 'performer_transactions_idx' },
    { key: { status: 1, initiatedAt: 1 }, name: 'pending_transactions_idx' },
    { key: { gameSessionId: 1 }, name: 'session_transactions_idx' },
    { key: { createdAt: 1, archived: 1 }, name: 'archival_idx' },
    { key: { ledgerTransactionId: 1 }, name: 'ledger_reconciliation_idx' }
  ]);
  console.log('✓ Created sm_payout_transactions collection');

  console.log('SM queue and payout collections created successfully!');
};

module.exports.down = async function down(db) {
  console.log('Dropping SM queue and payout collections...');

  await db.collection('sm_queue_entries').drop();
  console.log('✓ Dropped sm_queue_entries collection');

  await db.collection('sm_game_sessions').drop();
  console.log('✓ Dropped sm_game_sessions collection');

  await db.collection('sm_payout_transactions').drop();
  console.log('✓ Dropped sm_payout_transactions collection');

  console.log('SM queue and payout collections dropped successfully!');
};
