import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrProcessingTables1778316842730 implements MigrationInterface {
  name = 'PrProcessingTables1778316842730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "pull_request_reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "provider" character varying NOT NULL,
                "result" json NOT NULL,
                "status" character varying NOT NULL,
                "error" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "pull_request_id" uuid,
                CONSTRAINT "PK_0087e7a1da7acd51cf61ab581fd" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "pull_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "pr_number" integer NOT NULL,
                "title" character varying NOT NULL,
                "state" character varying NOT NULL,
                "author" character varying NOT NULL,
                "base_branch" character varying NOT NULL,
                "head_branch" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "merged_at" TIMESTAMP NOT NULL,
                "last_synced" TIMESTAMP NOT NULL,
                "repo_id" uuid,
                CONSTRAINT "UQ_99b9482d3949b48f7e380aebcc2" UNIQUE ("repo_id", "pr_number"),
                CONSTRAINT "PK_e8a8aa8710c3a9650a19a9c2e7b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "pull_request_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "file_name" character varying(255) NOT NULL,
                "patch" text NOT NULL,
                "status" character varying NOT NULL,
                "additions" integer NOT NULL,
                "deletions" integer NOT NULL,
                "sha" character varying,
                "pull_request_id" uuid,
                CONSTRAINT "UQ_b9ddf0b598ad308baab1ab255ce" UNIQUE ("pull_request_id", "file_name"),
                CONSTRAINT "PK_cb948511c9f227222276ef4361a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "github_webhook_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "delivery_id" character varying NOT NULL,
                "event_type" character varying NOT NULL,
                "payload" json NOT NULL,
                "processed" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL,
                CONSTRAINT "UQ_6f84956d95adbb7d37ec68e5440" UNIQUE ("delivery_id"),
                CONSTRAINT "PK_87a04871aa8ff67de94ddf83d7c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6f84956d95adbb7d37ec68e544" ON "github_webhook_events" ("delivery_id")
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
            ALTER TABLE "pull_request_reviews"
            ADD CONSTRAINT "FK_f1bb594f90bb45eb49852a59407" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests"
            ADD CONSTRAINT "FK_292d27c87db892edc6e3a59bcdb" FOREIGN KEY ("repo_id") REFERENCES "github_repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_files"
            ADD CONSTRAINT "FK_ec1c31cf4ed9f61552a51dfbef2" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pull_request_files" DROP CONSTRAINT "FK_ec1c31cf4ed9f61552a51dfbef2"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_292d27c87db892edc6e3a59bcdb"
        `);
    await queryRunner.query(`
            ALTER TABLE "pull_request_reviews" DROP CONSTRAINT "FK_f1bb594f90bb45eb49852a59407"
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
            DROP INDEX "public"."IDX_6f84956d95adbb7d37ec68e544"
        `);
    await queryRunner.query(`
            DROP TABLE "github_webhook_events"
        `);
    await queryRunner.query(`
            DROP TABLE "pull_request_files"
        `);
    await queryRunner.query(`
            DROP TABLE "pull_requests"
        `);
    await queryRunner.query(`
            DROP TABLE "pull_request_reviews"
        `);
  }
}
