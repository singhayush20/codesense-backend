import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePullRequest1778613352989 implements MigrationInterface {
    name = 'UpdatePullRequest1778613352989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "head_sha" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "llm_providers" ALTER COLUMN "public_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "llm_providers" ALTER COLUMN "public_id" SET DEFAULT gen_random_uuid()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_providers" ALTER COLUMN "public_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "llm_providers" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "head_sha"`);
    }

}
