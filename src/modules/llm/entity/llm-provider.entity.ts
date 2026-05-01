import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entity/user.entity";
import { ProviderType } from "../enums/provider.type";
import { LlmProviderCredential } from "./llm-provider-credential.entity";

@Entity('llm_providers')
@Index('idx_llm_providers_user', ['user'])
@Unique('uq_user_provider_display', ['user', 'displayName'])
export class LLMProvider {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    name: 'public_id',
    type: 'uuid',
    unique: true,
    default: () => 'gen_random_uuid()',
  })
  publicId!: string;

  @ManyToOne(() => User, (user) => user.llmProviders, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'provider_type',
    type: 'enum',
    enum: ProviderType,
    enumName: 'provider_type_enum',
  })
  providerType!: ProviderType;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 100,
  })
  displayName!: string;

  @Column({
    name: 'is_active',
    default: true,
  })
  isActive!: boolean;

  @OneToOne(() => LlmProviderCredential, (credential) => credential.provider)
  credential?: LlmProviderCredential;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
