import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../user/entity/user.entity';

@Entity('auth_refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'session_id', nullable: false })
  sessionId!: string;

  @Column({ name: 'token_hash', unique: true, nullable: false })
  tokenHash!: string;

  @Column({ name: 'expires_at', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt?: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'replaced_by_token_id', nullable: true })
  replacedByTokenId?: number;
}
