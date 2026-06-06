import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateWebhookDeliveriesTable1717600000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'webhook_deliveries',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenant_id', type: 'uuid' },
          { name: 'contact_workflow_step_id', type: 'uuid' },
          { name: 'url', type: 'text' },
          { name: 'method', type: 'varchar', length: '10', default: "'POST'" },
          { name: 'request_headers', type: 'jsonb', isNullable: true },
          { name: 'request_body', type: 'text', isNullable: true },
          { name: 'response_status', type: 'int', isNullable: true },
          { name: 'response_body', type: 'text', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('webhook_deliveries', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['contact_workflow_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contact_workflow_steps',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('webhook_deliveries');
    if (table) {
      await queryRunner.dropForeignKeys('webhook_deliveries', table.foreignKeys);
    }
    await queryRunner.dropTable('webhook_deliveries');
  }
}
