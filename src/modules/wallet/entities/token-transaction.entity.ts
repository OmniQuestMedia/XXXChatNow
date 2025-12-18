import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('token_transactions')
@Index(['userId'])
@Index(['createdAt'])
@Index(['idempotencyKey'], { unique: true })
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column('int')
  amount: number;

  @Column()
  purpose: string;

  @Column('jsonb', { name: 'lots_used' })
  lotsUsed: TokenLotUsage[];

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column('inet', { name: 'ip_address', nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

export interface TokenLotUsage {
  lotId: string;
  tokensUsed: number;
  lotType: string;
}
