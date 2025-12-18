import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TokenLotType {
  PROMO_BONUS = 'promo_bonus',
  MEMBERSHIP_MONTHLY = 'membership_monthly',
  PURCHASED = 'purchased',
}

@Entity('token_lots')
@Index(['userId'])
@Index(['expiresAt'])
@Index(['lotType'])
export class TokenLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TokenLotType,
    name: 'lot_type',
  })
  lotType: TokenLotType;

  @Column('int')
  tokens: number;

  @Column('int', { name: 'original_tokens' })
  originalTokens: number;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column('timestamptz', { name: 'awarded_at' })
  awardedAt: Date;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;

  @Column('timestamptz', { name: 'grace_expires_at' })
  graceExpiresAt: Date;

  @Column('boolean', { default: false })
  expired: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
