import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEmailMessagesTable1717600000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenant_id', type: 'uuid' },
          { name: 'contact_id', type: 'uuid' },
          { name: 'contact_workflow_id', type: 'uuid' },
          { name: 'contact_workflow_step_id', type: 'uuid' },
          { name: 'workflow_id', type: 'uuid' },
          { name: 'workflow_step_id', type: 'uuid' },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'ses_message_id', type: 'varchar', length: '255', isNullable: true },
          { name: 'recipient_email_hash', type: 'varchar', length: '64', isNullable: true },
          { name: 'subject', type: 'varchar', length: '998' },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'bounced_at', type: 'timestamp', isNullable: true },
          { name: 'complained_at', type: 'timestamp', isNullable: true },
          { name: 'first_opened_at', type: 'timestamp', isNullable: true },
          { name: 'last_opened_at', type: 'timestamp', isNullable: true },
          { name: 'first_clicked_at', type: 'timestamp', isNullable: true },
          { name: 'last_clicked_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKeys('email_messages', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['contact_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['contact_workflow_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contact_workflows',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['contact_workflow_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contact_workflow_steps',
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
      new TableForeignKey({
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'email_templates',
        onDelete: 'SET NULL',
      }),
    ]);

    // Indexes
    await queryRunner.createIndex(
      'email_messages',
      new TableIndex({
        name: 'IDX_email_messages_ses_message_id',
        columnNames: ['ses_message_id'],
        isUnique: true,
        where: 'ses_message_id IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'email_messages',
      new TableIndex({
        name: 'IDX_email_messages_contact_workflow_step',
        columnNames: ['contact_workflow_step_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('email_messages');
    if (table) {
      const fks = table.foreignKeys;
      await queryRunner.dropForeignKeys('email_messages', fks);

      const indices = table.indices;
      await queryRunner.dropIndices('email_messages', indices);
    }
    await queryRunner.dropTable('email_messages');
  }
}
