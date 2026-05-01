import type     { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGithubAccount1776797951672 implements MigrationInterface {
  name = 'CreateGithubAccount1776797951672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_repo_selection" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" bigint NOT NULL,
                "repository_id" uuid NOT NULL,
                CONSTRAINT "PK_10d0a479a04201a7b1ae3492505" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_392ccde5990e9c55bb11faf0b0" ON "user_repo_selection" ("user_id", "repository_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "github_repositories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "repoId" bigint NOT NULL,
                "name" character varying NOT NULL,
                "fullName" character varying NOT NULL,
                "isPrivate" boolean NOT NULL,
                "permissions" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "github_account_id" uuid NOT NULL,
                CONSTRAINT "PK_b79a368b43cd2b79b14ca6fb2e2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_af38966796520ec1337881cf17" ON "github_repositories" ("github_account_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0f872f45699dbb7da8d042bdca" ON "github_repositories" ("repoId")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_44ba80fb5ec0b8085c95b53d24" ON "github_repositories" ("github_account_id", "repoId")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."github_account_type_enum" AS ENUM('USER', 'ORGANIZATION')
        `);
    await queryRunner.query(`
            CREATE TABLE "github_accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "githubAccountId" bigint NOT NULL,
                "loginId" character varying NOT NULL,
                "accountType" "public"."github_account_type_enum" NOT NULL,
                "installationId" bigint NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" bigint NOT NULL,
                CONSTRAINT "UQ_fd0beda884c6bd1d51b75c75d82" UNIQUE ("loginId"),
                CONSTRAINT "UQ_75c1fee484aa1bdf3bb2bd0ecf9" UNIQUE ("installationId"),
                CONSTRAINT "PK_01b75d48868462b91c920cc80dc" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c9f3ffebee489b8dd8810b5717" ON "github_accounts" ("user_id", "githubAccountId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2abe4d09959ff963e5489f345d" ON "github_accounts" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
            ADD CONSTRAINT "FK_9b01acfe2802ba3601001ba4065" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_repo_selection"
            ADD CONSTRAINT "FK_2e7cf1751fe624e287a4b5c0888" FOREIGN KEY ("repository_id") REFERENCES "github_repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "github_repositories"
            ADD CONSTRAINT "FK_af38966796520ec1337881cf179" FOREIGN KEY ("github_account_id") REFERENCES "github_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "github_accounts"
            ADD CONSTRAINT "FK_2abe4d09959ff963e5489f345da" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "github_accounts" DROP CONSTRAINT "FK_2abe4d09959ff963e5489f345da"
        `);
    await queryRunner.query(`
            ALTER TABLE "github_repositories" DROP CONSTRAINT "FK_af38966796520ec1337881cf179"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP CONSTRAINT "FK_2e7cf1751fe624e287a4b5c0888"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_repo_selection" DROP CONSTRAINT "FK_9b01acfe2802ba3601001ba4065"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2abe4d09959ff963e5489f345d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c9f3ffebee489b8dd8810b5717"
        `);
    await queryRunner.query(`
            DROP TABLE "github_accounts"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."github_account_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_44ba80fb5ec0b8085c95b53d24"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0f872f45699dbb7da8d042bdca"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_af38966796520ec1337881cf17"
        `);
    await queryRunner.query(`
            DROP TABLE "github_repositories"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_392ccde5990e9c55bb11faf0b0"
        `);
    await queryRunner.query(`
            DROP TABLE "user_repo_selection"
        `);
  }
}
