import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { LLMProvider } from "./llm-provider.entity";

@Entity('llm_provider_credentials')
export class LlmProviderCredential {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @OneToOne(() => LLMProvider, (provider) => provider.credential, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider!: LLMProvider;

  @Column({
    name: 'encrypted_config',
    type: 'text',
  })
  encryptedConfig!: string;

  @Column({
    name: 'key_fingerprint',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  keyFingerprint?: string;

  @Column({
    name: 'is_valid',
    default: false,
  })
  isValid!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
