import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "./user-role.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @Column({ name: 'name', nullable: false })
  name!: string;

  @Column({ name: 'email', unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password', nullable: false })
  password!: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    cascade: true,
  })
  userRoles!: UserRole[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
  
  @Column({ name: 'is_verified', default: true })
  isVerified!: boolean;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  updatedAt!: Date;
}