import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshToken1776685272214 implements MigrationInterface {
    name = 'CreateRefreshToken1776685272214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "auth_refresh_tokens" (
                "id" SERIAL NOT NULL,
                "session_id" character varying NOT NULL,
                "token_hash" character varying NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "used_at" TIMESTAMP,
                "revoked_at" TIMESTAMP,
                "replaced_by_token_id" integer,
                "userUserId" bigint NOT NULL,
                CONSTRAINT "UQ_95e0bce05491b0dee2f28ffd112" UNIQUE ("token_hash"),
                CONSTRAINT "PK_df6893d2063a4ea7bbf1eda31e5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "is_verified" boolean NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
            ADD CONSTRAINT "FK_5c49b0fde15959fa2288a82f212" FOREIGN KEY ("userUserId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_5c49b0fde15959fa2288a82f212"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "is_verified"
        `);
        await queryRunner.query(`
            DROP TABLE "auth_refresh_tokens"
        `);
    }

}
