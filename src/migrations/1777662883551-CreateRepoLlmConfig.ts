import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepoLlmConfig1777662883551 implements MigrationInterface {
    name = 'CreateRepoLlmConfig1777662883551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "repo_llm_config" (
                "id" SERIAL NOT NULL,
                "model_name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "repository_id" uuid NOT NULL,
                "provider_id" integer NOT NULL,
                CONSTRAINT "UQ_5e4cc35b84ff4e7929225ef788b" UNIQUE ("repository_id"),
                CONSTRAINT "PK_5424f861fc62f6d2b157f19ac21" PRIMARY KEY ("id")
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
            ALTER TABLE "repo_llm_config"
            ADD CONSTRAINT "FK_5e4cc35b84ff4e7929225ef788b" FOREIGN KEY ("repository_id") REFERENCES "github_repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "repo_llm_config"
            ADD CONSTRAINT "FK_2f36c8dd51ec283ce1308b6eded" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "repo_llm_config" DROP CONSTRAINT "FK_2f36c8dd51ec283ce1308b6eded"
        `);
        await queryRunner.query(`
            ALTER TABLE "repo_llm_config" DROP CONSTRAINT "FK_5e4cc35b84ff4e7929225ef788b"
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
            DROP TABLE "repo_llm_config"
        `);
    }

}
