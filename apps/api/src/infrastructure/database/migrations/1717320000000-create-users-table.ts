import { Table } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1717320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure pgcrypto extension is enabled for gen_random_uuid() compatibility in Postgres < 13
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar(254)',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar(60)',
          },
          {
            name: 'status',
            type: 'varchar(20)',
            default: "'new'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        checks: [
          {
            name: 'CHK_users_status',
            expression: `"status" IN ('new', 'approved', 'blocked')`,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
