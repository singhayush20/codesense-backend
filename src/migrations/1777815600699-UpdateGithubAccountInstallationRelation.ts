import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateGithubAccountInstallationRelation1777815600699 implements MigrationInterface {
    name = 'UpdateGithubAccountInstallationRelation1777815600699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "github_installations" DROP CONSTRAINT "FK_bb10fc749d748071815b49b1c56"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_installations"
            ADD CONSTRAINT "UQ_bb10fc749d748071815b49b1c56" UNIQUE ("account_id")
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c9f3ffebee489b8dd8810b5717"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD CONSTRAINT "UQ_6deb42f4233331e94061b259328" UNIQUE ("githubAccountId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD CONSTRAINT "UQ_fd0beda884c6bd1d51b75c75d82" UNIQUE ("loginId")
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
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c9f3ffebee489b8dd8810b5717" ON "github_accounts" ("user_id", "githubAccountId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_installations"
            ADD CONSTRAINT "FK_bb10fc749d748071815b49b1c56" FOREIGN KEY ("account_id") REFERENCES "github_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "github_installations" DROP CONSTRAINT "FK_bb10fc749d748071815b49b1c56"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c9f3ffebee489b8dd8810b5717"
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
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP CONSTRAINT "UQ_fd0beda884c6bd1d51b75c75d82"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP CONSTRAINT "UQ_6deb42f4233331e94061b259328"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c9f3ffebee489b8dd8810b5717" ON "github_accounts" ("githubAccountId", "user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_installations" DROP CONSTRAINT "UQ_bb10fc749d748071815b49b1c56"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_installations"
            ADD CONSTRAINT "FK_bb10fc749d748071815b49b1c56" FOREIGN KEY ("account_id") REFERENCES "github_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
