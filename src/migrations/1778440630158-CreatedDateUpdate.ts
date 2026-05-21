import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedDateUpdate1778440630158 implements MigrationInterface {
  name = 'CreatedDateUpdate1778440630158';

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
            ALTER TABLE "github_webhook_events" DROP COLUMN "created_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "github_webhook_events"
            ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "github_webhook_events" DROP COLUMN "created_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "github_webhook_events"
            ADD "created_at" TIMESTAMP NOT NULL
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
