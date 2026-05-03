import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorGithubAccountAndAddInstallation1777794102690 implements MigrationInterface {
    name = 'RefactorGithubAccountAndAddInstallation1777794102690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP CONSTRAINT "FK_af38966796520ec1337881cf179"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_af38966796520ec1337881cf17"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0f872f45699dbb7da8d042bdca"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_44ba80fb5ec0b8085c95b53d24"
        `);
        await queryRunner.query(`
            CREATE TABLE "github_installations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "installationId" bigint NOT NULL,
                "targetId" bigint NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "account_id" uuid NOT NULL,
                CONSTRAINT "PK_6c4f96ba219a87cf299f5e01397" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bb10fc749d748071815b49b1c5" ON "github_installations" ("account_id")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c5d026b1eaea1fb95f48919aaf" ON "github_installations" ("installationId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP COLUMN "repoId"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP COLUMN "github_account_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP CONSTRAINT "UQ_75c1fee484aa1bdf3bb2bd0ecf9"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "installationId"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."github_account_status_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "disconnected_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
            ADD "isActive" boolean NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD "githubRepoId" bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD "installation_id" uuid NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "isConnected" boolean NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP CONSTRAINT "UQ_fd0beda884c6bd1d51b75c75d82"
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
            CREATE INDEX "idx_user_repo_active" ON "user_repo_selection" ("user_id", "repository_id", "isActive")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_122ce08e74dad62d9eaa0b2f06" ON "github_repositories" ("githubRepoId", "installation_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_31a167f4a5e3675b34af5caffc" ON "github_repositories" ("installation_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fd0faad78548e929115e42d974" ON "github_repositories" ("githubRepoId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD CONSTRAINT "FK_31a167f4a5e3675b34af5caffc6" FOREIGN KEY ("installation_id") REFERENCES "github_installations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "github_installations"
            ADD CONSTRAINT "FK_bb10fc749d748071815b49b1c56" FOREIGN KEY ("account_id") REFERENCES "github_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "github_installations" DROP CONSTRAINT "FK_bb10fc749d748071815b49b1c56"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP CONSTRAINT "FK_31a167f4a5e3675b34af5caffc6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fd0faad78548e929115e42d974"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_31a167f4a5e3675b34af5caffc"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_122ce08e74dad62d9eaa0b2f06"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_repo_active"
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
            ALTER TABLE "github_accounts"
            ADD CONSTRAINT "UQ_fd0beda884c6bd1d51b75c75d82" UNIQUE ("loginId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP COLUMN "isConnected"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP COLUMN "installation_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP COLUMN "githubRepoId"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP COLUMN "isActive"
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "disconnected_at" TIMESTAMP
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."github_account_status_enum" AS ENUM('ACTIVE', 'DISCONNECTED')
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "status" "public"."github_account_status_enum" NOT NULL DEFAULT 'ACTIVE'
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD "installationId" bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD CONSTRAINT "UQ_75c1fee484aa1bdf3bb2bd0ecf9" UNIQUE ("installationId")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD "github_account_id" uuid NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD "repoId" bigint NOT NULL
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c5d026b1eaea1fb95f48919aaf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bb10fc749d748071815b49b1c5"
        `);
        await queryRunner.query(`
            DROP TABLE "github_installations"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_44ba80fb5ec0b8085c95b53d24" ON "github_repositories" ("repoId", "github_account_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0f872f45699dbb7da8d042bdca" ON "github_repositories" ("repoId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_af38966796520ec1337881cf17" ON "github_repositories" ("github_account_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD CONSTRAINT "FK_af38966796520ec1337881cf179" FOREIGN KEY ("github_account_id") REFERENCES "github_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
