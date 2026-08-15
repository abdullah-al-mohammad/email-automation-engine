import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class CreateContactWorkflowsTable1717500000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contact_workflows',
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
            name: 'workflow_id',
            type: 'uuid',
          },
          {
            name: 'workflow_trigger_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'contact_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar(50)',
            default: "'pending'",
          },
          {
            name: 'trigger_event',
            type: 'varchar(100)',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'finished_at',
            type: 'timestamp',
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
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['workflow_id'],
            referencedTableName: 'workflows',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['workflow_trigger_id'],
            referencedTableName: 'workflow_triggers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['contact_id'],
            referencedTableName: 'contacts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contact_workflows');
  }
}
