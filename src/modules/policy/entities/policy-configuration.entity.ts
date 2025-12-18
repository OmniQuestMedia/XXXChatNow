import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('policy_configuration')
export class PolicyConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column('jsonb')
  value: any;

  @Column('text')
  description: string;

  @Column()
  category: string;

  @Column('text', { array: true, default: '{}' })
  editableBy: string[];

  @UpdateDateColumn({ name: 'last_modified' })
  lastModified: Date;

  @Column({ name: 'modified_by', nullable: true })
  modifiedBy: string;

  @Column('int', { default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
