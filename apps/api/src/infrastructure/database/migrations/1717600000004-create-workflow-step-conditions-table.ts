import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateWorkflowStepConditionsTable1717600000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_step_conditions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenant_id', type: 'uuid' },
          { name: 'workflow_id', type: 'uuid' },
          { name: 'workflow_step_id', type: 'uuid' },
          { name: 'type', type: 'varchar', length: '50' },
          { name: 'resource', type: 'varchar', length: '255' },
          { name: 'operator', type: 'varchar', length: '50' },
          { name: 'value', type: 'text', isNullable: true },
          { name: 'logical_operator', type: 'varchar', length: '10', default: "'AND'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('workflow_step_conditions', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['workflow_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflows',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['workflow_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_steps',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('workflow_step_conditions');
    if (table) {
      await queryRunner.dropForeignKeys('workflow_step_conditions', table.foreignKeys);
    }
    await queryRunner.dropTable('workflow_step_conditions');
  }
}
