import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEmailEventsTable1717600000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_events',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenant_id', type: 'uuid' },
          { name: 'email_message_id', type: 'uuid' },
          { name: 'contact_id', type: 'uuid' },
          { name: 'event', type: 'varchar', length: '50' },
          { name: 'url', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'occurred_at', type: 'timestamp' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('email_events', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['email_message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'email_messages',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['contact_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'email_events',
      new TableIndex({
        name: 'IDX_email_events_dedup',
        columnNames: ['email_message_id', 'event', 'occurred_at'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('email_events');
    if (table) {
      await queryRunner.dropForeignKeys('email_events', table.foreignKeys);
      await queryRunner.dropIndices('email_events', table.indices);
    }
    await queryRunner.dropTable('email_events');
  }
}
