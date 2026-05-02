import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGithubAccountActiveIndex1777729067765 implements MigrationInterface {
    name = 'AddGithubAccountActiveIndex1777729067765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id"
            SET DEFAULT gen_random_uuid()
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_repo_active" ON "user_repo_selection" ("user_id", "repository_id", "isActive")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_repo_active"
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ALTER COLUMN "public_id"
            SET DEFAULT uuid_generate_v4()
        `);
    }

}
