import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

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
  payload!: Record<string, any>;

  @Column({ name: 'processed', default: false })
  processed!: boolean;

  @Column({ name: 'created_at', nullable: false })
  createdAt!: Date;
}