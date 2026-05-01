import type     { MigrationInterface, QueryRunner } from 'typeorm';

export class ColumnRename1776798251617 implements MigrationInterface {
  name = 'ColumnRename1776798251617';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_5c49b0fde15959fa2288a82f212"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
                RENAME COLUMN "userUserId" TO "github_account_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
            ADD CONSTRAINT "FK_088d46566b48a51672e210c0c45" FOREIGN KEY ("github_account_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_088d46566b48a51672e210c0c45"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
                RENAME COLUMN "github_account_id" TO "userUserId"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
            ADD CONSTRAINT "FK_5c49b0fde15959fa2288a82f212" FOREIGN KEY ("userUserId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
