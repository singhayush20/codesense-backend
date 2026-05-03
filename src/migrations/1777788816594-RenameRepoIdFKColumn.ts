import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRepoIdFKColumn1777788816594 implements MigrationInterface {
    name = 'RenameRepoIdFKColumn1777788816594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP CONSTRAINT "FK_2e7cf1751fe624e287a4b5c0888"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_392ccde5990e9c55bb11faf0b0"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
                RENAME COLUMN "repository_id" TO "repoId"
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
            CREATE UNIQUE INDEX "IDX_583a7e4c2116d925de47b04b00" ON "user_repo_selection" ("user_id", "repoId")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
            ADD CONSTRAINT "FK_26d1e3247f198eb1edbffafa0c4" FOREIGN KEY ("repoId") REFERENCES "github_repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP CONSTRAINT "FK_26d1e3247f198eb1edbffafa0c4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_583a7e4c2116d925de47b04b00"
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
            ALTER TABLE "user_repo_selection"
                RENAME COLUMN "repoId" TO "repository_id"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_392ccde5990e9c55bb11faf0b0" ON "user_repo_selection" ("user_id", "repository_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
            ADD CONSTRAINT "FK_2e7cf1751fe624e287a4b5c0888" FOREIGN KEY ("repository_id") REFERENCES "github_repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
