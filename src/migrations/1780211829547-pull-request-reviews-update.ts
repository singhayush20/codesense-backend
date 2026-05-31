import { MigrationInterface, QueryRunner } from "typeorm";

export class PullRequestReviewsUpdate1780211829547 implements MigrationInterface {
    name = 'PullRequestReviewsUpdate1780211829547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_jobs"
            ADD CONSTRAINT "UQ_df662d3815fd697ed54a1e013b3" UNIQUE ("run_id")
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
            ADD CONSTRAINT "FK_c34687db159c41f6437e923da4e" FOREIGN KEY ("id") REFERENCES "pull_request_review_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pull_request_review_job_results" DROP CONSTRAINT "FK_c34687db159c41f6437e923da4e"
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
            ALTER TABLE "pull_request_review_jobs" DROP CONSTRAINT "UQ_df662d3815fd697ed54a1e013b3"
        `);
    }

}
