import { MigrationInterface, QueryRunner } from "typeorm";

export class FileSnapshotsFetch1778610115080 implements MigrationInterface {
    name = 'FileSnapshotsFetch1778610115080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "pull_request_file_snapshots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "sha" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "expired_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "pull_request_file_id" uuid,
                CONSTRAINT "PK_a34800ee72373ad55f69c91f84e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dc0e9d1a206453a2b599afb94d" ON "pull_request_file_snapshots" ("expired_at")
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
            ALTER TABLE "pull_request_file_snapshots"
            ADD CONSTRAINT "FK_6323cfbcac0777f5f2d3afe06ba" FOREIGN KEY ("pull_request_file_id") REFERENCES "pull_request_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pull_request_file_snapshots" DROP CONSTRAINT "FK_6323cfbcac0777f5f2d3afe06ba"
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
            DROP INDEX "public"."IDX_dc0e9d1a206453a2b599afb94d"
        `);
        await queryRunner.query(`
            DROP TABLE "pull_request_file_snapshots"
        `);
    }

}
