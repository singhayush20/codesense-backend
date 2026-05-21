import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnsToPullRequest1778521902847 implements MigrationInterface {
  name = 'AddColumnsToPullRequest1778521902847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "additions" integer NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "deletions" integer NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "changed_files" integer NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "commits" integer NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "body" text
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
            ALTER TABLE "pull_requests" DROP COLUMN "body"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "commits"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "changed_files"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "deletions"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "additions"
        `);
  }
}
