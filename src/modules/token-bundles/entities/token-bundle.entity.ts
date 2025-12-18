import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserTier {
  RACK_RATE = 'rack_rate',
  VIP = 'vip',
  GOLD_VIP = 'gold_vip',
  SILVER_VIP = 'silver_vip',
  PLATINUM_VIP = 'platinum_vip',
}

@Entity('token_bundles')
export class TokenBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserTier,
  })
  tier: UserTier;

  @Column('int')
  tokens: number;

  @Column('int', { name: 'price_usd', comment: 'Price in USD cents' })
  priceUsd: number;

  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column('boolean', { default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual property for cost per token (not stored in DB)
  get costPerToken(): number {
    return this.priceUsd / this.tokens;
  }
}
