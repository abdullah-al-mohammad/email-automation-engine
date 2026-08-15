import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTenantInvitationsTable1717700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenant_invitations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
          },
          {
            name: 'invitation_token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
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
      }),
    );

    await queryRunner.createIndex(
      'tenant_invitations',
      new TableIndex({
        name: 'IDX_tenant_invitations_tenant_email',
        columnNames: ['tenant_id', 'email'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'tenant_invitations',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenant_invitations');
  }
}
