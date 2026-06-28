import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeadShaToReviewRun1782626022725 implements MigrationInterface {
  name = 'AddHeadShaToReviewRun1782626022725';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs"
            ADD "head_sha" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs"
            ADD "base_sha" character varying
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."pull_request_review_status_enum"
            RENAME TO "pull_request_review_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."pull_request_review_status_enum" AS ENUM(
                'success',
                'failed',
                'in_progress',
                'cancelled',
                'superseded'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs"
            ALTER COLUMN "status" TYPE "public"."pull_request_review_status_enum" USING "status"::"text"::"public"."pull_request_review_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pull_request_review_status_enum_old"
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
            CREATE TYPE "public"."pull_request_review_status_enum_old" AS ENUM('success', 'failed', 'in_progress')
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs"
            ALTER COLUMN "status" TYPE "public"."pull_request_review_status_enum_old" USING "status"::"text"::"public"."pull_request_review_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pull_request_review_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."pull_request_review_status_enum_old"
            RENAME TO "pull_request_review_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs" DROP COLUMN "base_sha"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs" DROP COLUMN "head_sha"
        `);
  }
}
