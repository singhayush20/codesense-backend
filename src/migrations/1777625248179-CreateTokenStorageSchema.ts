import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTokenStorageSchema1777625248179 implements MigrationInterface {
    name = 'CreateTokenStorageSchema1777625248179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "llm_provider_credentials" (
                "id" SERIAL NOT NULL,
                "encrypted_config" text NOT NULL,
                "key_fingerprint" character varying(64),
                "is_valid" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "provider_id" integer NOT NULL,
                CONSTRAINT "REL_7d14c349db2cc4fe53e54140ee" UNIQUE ("provider_id"),
                CONSTRAINT "PK_e28e493a8d193a9d3e7b89e1ba6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."provider_type_enum" AS ENUM(
                'openai',
                'anthropic',
                'gemini',
                'bedrock',
                'ollama',
                'nvidia'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "llm_providers" (
                "id" SERIAL NOT NULL,
                "public_id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "provider_type" "public"."provider_type_enum" NOT NULL,
                "display_name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" bigint NOT NULL,
                CONSTRAINT "UQ_36bf691eb33810aca3d8cf2c27b" UNIQUE ("public_id"),
                CONSTRAINT "uq_user_provider_display" UNIQUE ("user_id", "display_name"),
                CONSTRAINT "PK_98a22bf2f8befea87081c600b3f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_llm_providers_user" ON "llm_providers" ("user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_provider_credentials"
            ADD CONSTRAINT "FK_7d14c349db2cc4fe53e54140ee9" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_providers"
            ADD CONSTRAINT "FK_0eb496e627faa3f79eba3c16cdb" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "llm_providers" DROP CONSTRAINT "FK_0eb496e627faa3f79eba3c16cdb"
        `);
        await queryRunner.query(`
            ALTER TABLE "llm_provider_credentials" DROP CONSTRAINT "FK_7d14c349db2cc4fe53e54140ee9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_llm_providers_user"
        `);
        await queryRunner.query(`
            DROP TABLE "llm_providers"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."provider_type_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "llm_provider_credentials"
        `);
    }

}
