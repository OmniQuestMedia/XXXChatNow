/**
 * SM-Game-Session Schema
 * 
 * Tracks active slot machine game sessions between users and models.
 * Enforces: Only ONE active session per model at any time.
 * 
 * Key Features:
 * - Prevents concurrent games with same model
 * - Tracks game lifecycle (start, play, complete)
 * - Immutable transaction record per prize fulfillment
 * - Complete audit trail with timestamps
 * 
 * Security:
 * - All calculations server-side
 * - Idempotency enforced
 * - No PII in logs (IDs only)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ObjectId } from 'mongodb';

export type SMGameSessionDocument = HydratedDocument<SMGameSession>;

export enum GameSessionStatus {
  INITIALIZING = 'initializing', // Session being created
  ACTIVE = 'active',             // Game in progress
  COMPLETED = 'completed',       // Game finished successfully
  ABANDONED = 'abandoned',       // User abandoned mid-game
  FAILED = 'failed',             // Technical error during game
  REFUNDED = 'refunded'          // Game failed, user refunded
}

@Schema({
  collection: 'sm_game_sessions',
  timestamps: true
})
export class SMGameSession {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  sessionId: string; // Format: session_{timestamp}_{uuid}

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  userId: ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  performerId: ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true
  })
  queueId: string; // Reference to SM-Queue-Entry

  @Prop({
    type: String,
    enum: Object.values(GameSessionStatus),
    default: GameSessionStatus.INITIALIZING,
    index: true
  })
  status: GameSessionStatus;

  @Prop({
    type: Number,
    required: true
  })
  betAmount: number; // Tokens per spin

  @Prop({
    type: Number,
    default: 0
  })
  totalSpins: number; // Total spins in this session

  @Prop({
    type: Number,
    default: 0
  })
  totalWinnings: number; // Total winnings in this session

  @Prop({
    type: Number,
    default: 0
  })
  totalLosses: number; // Total losses in this session

  @Prop({
    type: Date,
    required: true,
    default: Date.now
  })
  startedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  completedAt: Date;

  @Prop({
    type: Number,
    default: null
  })
  durationMs: number; // Session duration in milliseconds

  @Prop({
    type: [String],
    default: []
  })
  spinIds: string[]; // References to individual spin transactions

  @Prop({
    type: String,
    default: null
  })
  ledgerTransactionId: string; // Reference to Ledger API transaction

  @Prop({
    type: Object,
    default: null
  })
  ledgerStatus: {
    isHealthy: boolean;        // Was Ledger API healthy during session?
    lastCheckAt: Date;         // Last health check timestamp
    failureCount: number;      // Number of failed Ledger calls
    recoveredAt?: Date;        // When Ledger recovered (if it failed)
  };

  @Prop({
    type: Object,
    default: null
  })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    abandonmentReason?: string;
    errorDetails?: string;
  };

  @Prop({
    type: String,
    default: null
  })
  integrityHash: string; // Hash of session data for tamper detection

  @Prop({
    type: Boolean,
    default: false
  })
  archived: boolean; // For 8-year retention policy

  // Timestamps (createdAt, updatedAt) added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const SMGameSessionSchema = SchemaFactory.createForClass(SMGameSession);

// Compound indexes for efficient queries
SMGameSessionSchema.index({ performerId: 1, status: 1 }); // Enforce one active session per model
SMGameSessionSchema.index({ userId: 1, status: 1, startedAt: -1 }); // Get user's game history
SMGameSessionSchema.index({ status: 1, completedAt: 1 }); // Analytics queries
SMGameSessionSchema.index({ createdAt: 1, archived: 1 }); // Archival queries

// Unique constraint: Only one active session per performer
SMGameSessionSchema.index(
  { performerId: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: [GameSessionStatus.INITIALIZING, GameSessionStatus.ACTIVE] }
    }
  }
);
