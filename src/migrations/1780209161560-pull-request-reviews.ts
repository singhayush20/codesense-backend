import { MigrationInterface, QueryRunner } from 'typeorm';

export class PullRequestReviews1780209161560 implements MigrationInterface {
  name = 'PullRequestReviews1780209161560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "pull_request_review_job_results" (
                "id" SERIAL NOT NULL,
                "total_input_tokens" integer NOT NULL,
                "total_output_tokens" integer NOT NULL,
                "total_tokens" integer NOT NULL,
                "comments" json NOT NULL,
                "summary" text NOT NULL,
                CONSTRAINT "PK_c34687db159c41f6437e923da4e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."pull_request_review_status_enum" AS ENUM('success', 'failed', 'in_progress')
        `);
    await queryRunner.query(`
            CREATE TABLE "pull_request_review_jobs" (
                "id" SERIAL NOT NULL,
                "run_id" character varying NOT NULL,
                "provider_type" "public"."provider_type_enum" NOT NULL,
                "status" "public"."pull_request_review_status_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "pull_request_id" uuid,
                CONSTRAINT "PK_f8a5352d8482a68dbff95220531" PRIMARY KEY ("id")
            )
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
            ALTER TABLE "pull_request_review_jobs"
            ADD CONSTRAINT "FK_166d455fe374bdb461dcc48afcc" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs" DROP CONSTRAINT "FK_166d455fe374bdb461dcc48afcc"
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
            DROP TABLE "pull_request_review_jobs"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pull_request_review_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "pull_request_review_job_results"
        `);
  }
}
