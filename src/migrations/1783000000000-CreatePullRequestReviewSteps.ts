import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePullRequestReviewSteps1783000000000 implements MigrationInterface {
  name = 'CreatePullRequestReviewSteps1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."review_workflow_step_enum" AS ENUM(
        'initializing',
        'fetching_pull_request',
        'building_review_context',
        'generating_review',
        'saving_results',
        'completed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."review_workflow_step_status_enum" AS ENUM(
        'pending',
        'running',
        'success',
        'failed',
        'cancelled',
        'skipped'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "pull_request_review_steps" (
        "id" SERIAL NOT NULL,
        "job_id" integer NOT NULL,
        "step" "public"."review_workflow_step_enum" NOT NULL,
        "status" "public"."review_workflow_step_status_enum" NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "duration_ms" integer,
        "error_message" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_pull_request_review_steps_job_step" UNIQUE ("job_id", "step"),
        CONSTRAINT "PK_pull_request_review_steps" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pull_request_review_steps_job_id"
      ON "pull_request_review_steps" ("job_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pull_request_review_steps_status"
      ON "pull_request_review_steps" ("status")
    `);
    await queryRunner.query(`
      ALTER TABLE "pull_request_review_steps"
      ADD CONSTRAINT "FK_pull_request_review_steps_job"
      FOREIGN KEY ("job_id")
      REFERENCES "pull_request_review_jobs"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pull_request_review_steps"
      DROP CONSTRAINT "FK_pull_request_review_steps_job"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_pull_request_review_steps_status"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_pull_request_review_steps_job_id"
    `);
    await queryRunner.query(`
      DROP TABLE "pull_request_review_steps"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."review_workflow_step_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."review_workflow_step_enum"
    `);
  }
}
