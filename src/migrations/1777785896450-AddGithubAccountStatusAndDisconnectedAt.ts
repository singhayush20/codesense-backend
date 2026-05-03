import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGithubAccountStatusAndDisconnectedAt1777785896450 implements MigrationInterface {
    name = 'AddGithubAccountStatusAndDisconnectedAt1777785896450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."github_account_status_enum" AS ENUM('ACTIVE', 'DISCONNECTED')
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "status" "public"."github_account_status_enum" NOT NULL DEFAULT 'ACTIVE'
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "disconnected_at" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id"
            SET DEFAULT gen_random_uuid()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id"
            SET DEFAULT uuid_generate_v4()
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "disconnected_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."github_account_status_enum"
        `);
    }

}
