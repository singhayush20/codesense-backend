import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { JsonObject } from '../../../types/types';

@Entity('github_webhook_events')
@Index(['deliveryId'], { unique: true })
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'delivery_id', unique: true, nullable: false })
  deliveryId!: string;

  @Column({ name: 'event_type', nullable: false })
  eventType!: string;

  @Column({ name: 'payload', type: 'json', nullable: false })
  payload!: JsonObject;

  @Column({ name: 'processed', default: false })
  processed!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
