import type     { MigrationInterface, QueryRunner } from 'typeorm';

export class ColumnRenameUserId1776798354489 implements MigrationInterface {
  name = 'ColumnRenameUserId1776798354489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_088d46566b48a51672e210c0c45"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
                RENAME COLUMN "github_account_id" TO "user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
            ADD CONSTRAINT "FK_f795ad14f31838e3ddc663ee150" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_f795ad14f31838e3ddc663ee150"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
                RENAME COLUMN "user_id" TO "github_account_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_refresh_tokens"
            ADD CONSTRAINT "FK_088d46566b48a51672e210c0c45" FOREIGN KEY ("github_account_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
