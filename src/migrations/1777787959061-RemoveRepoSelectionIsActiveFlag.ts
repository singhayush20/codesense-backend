import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRepoSelectionIsActiveFlag1777787959061 implements MigrationInterface {
    name = 'RemoveRepoSelectionIsActiveFlag1777787959061'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_repo_active"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP COLUMN "isActive"
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
            ALTER TABLE "user_repo_selection"
            ADD "isActive" boolean NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_repo_active" ON "user_repo_selection" ("isActive", "user_id", "repository_id")
        `);
    }

}
