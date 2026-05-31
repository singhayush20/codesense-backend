import { MigrationInterface, QueryRunner } from "typeorm";

export class PullRequestReviewsFixes1780212348621 implements MigrationInterface {
    name = 'PullRequestReviewsFixes1780212348621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results" DROP CONSTRAINT "FK_c34687db159c41f6437e923da4e"
        `);
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results"
            ADD "job_id" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results"
            ADD CONSTRAINT "UQ_6808266b90eebab889d1936ff58" UNIQUE ("job_id")
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
            ALTER TABLE "pull_request_review_job_results"
            ADD CONSTRAINT "FK_6808266b90eebab889d1936ff58" FOREIGN KEY ("job_id") REFERENCES "pull_request_review_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results" DROP CONSTRAINT "FK_6808266b90eebab889d1936ff58"
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
            ALTER TABLE "pull_request_review_job_results" DROP CONSTRAINT "UQ_6808266b90eebab889d1936ff58"
        `);
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results" DROP COLUMN "job_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results"
            ADD CONSTRAINT "FK_c34687db159c41f6437e923da4e" FOREIGN KEY ("id") REFERENCES "pull_request_review_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
