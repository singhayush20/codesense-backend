import type     { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoles1776624548251 implements MigrationInterface {
  name = 'AddRoles1776624548251';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "role_id" SERIAL NOT NULL,
                "name" character varying(50) NOT NULL,
                "description" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"),
                CONSTRAINT "PK_09f4c8130b54f35925588a37b6a" PRIMARY KEY ("role_id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_role_id" SERIAL NOT NULL,
                "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" bigint,
                "role_id" integer,
                CONSTRAINT "PK_bf176da8ac1b528d4fe7ee438e3" PRIMARY KEY ("user_role_id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_23ed6f04fe43066df08379fd03" ON "user_roles" ("user_id", "role_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_23ed6f04fe43066df08379fd03"
        `);
    await queryRunner.query(`
            DROP TABLE "user_roles"
        `);
    await queryRunner.query(`
            DROP TABLE "roles"
        `);
  }
}
