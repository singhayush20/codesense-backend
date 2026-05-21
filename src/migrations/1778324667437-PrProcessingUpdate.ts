import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrProcessingUpdate1778324667437 implements MigrationInterface {
  name = 'PrProcessingUpdate1778324667437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "created_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "updated_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "merged_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "merged_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "last_synced"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "last_synced" TIMESTAMP WITH TIME ZONE NOT NULL
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
            ALTER TABLE "pull_requests" DROP COLUMN "last_synced"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "last_synced" TIMESTAMP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "merged_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "merged_at" TIMESTAMP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "updated_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "updated_at" TIMESTAMP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP COLUMN "created_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD "created_at" TIMESTAMP NOT NULL
        `);
  }
}
