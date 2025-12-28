import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * Wallet Verification Attempt Schema
 * Tracks all verification attempts for audit trail and rate limiting
 */
@Schema({
  collection: 'wallet_verification_attempts',
  timestamps: true
})
export class WalletVerificationAttempt {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  userId: ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  })
  status: string;

  @Prop({
    type: String,
    required: false
  })
  failureReason?: string;

  @Prop({
    type: String,
    required: false
  })
  ipAddress?: string;

  @Prop({
    type: String,
    required: false
  })
  userAgent?: string;
}

export type WalletVerificationAttemptDocument = HydratedDocument<WalletVerificationAttempt>;

export const WalletVerificationAttemptSchema = SchemaFactory.createForClass(WalletVerificationAttempt);

// Index for rate limiting queries
WalletVerificationAttemptSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_user_created' }
);

// Index for audit queries
WalletVerificationAttemptSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'idx_status_created' }
);
