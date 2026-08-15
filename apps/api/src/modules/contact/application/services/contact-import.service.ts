import { type ImportContactsResult } from '@email-automation-engine/shared';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

import { CONTACT_REPOSITORY } from '../../constants/tokens';
import { Contact } from '../../domain/aggregates/contact.aggregate';
import { ContactRepository } from '../../domain/repositories/contact.repository';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_MAX_ROWS = 10;

export interface CsvPreview {
  headers: string[];
  rows: string[][];
}

@Injectable()
export class ContactImportService {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
  ) {}

  previewCsv(fileBuffer: Buffer): CsvPreview {
    let records: Record<string, string>[];

    try {
      records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const headers = Object.keys(records[0] ?? {});
    const rows = records
      .slice(0, PREVIEW_MAX_ROWS)
      .map((record) => headers.map((h) => record[h] ?? ''));

    return { headers, rows };
  }

  async importCsv(tenantId: string, fileBuffer: Buffer): Promise<ImportContactsResult> {
    let records: Record<string, string>[];

    try {
      records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const headers = Object.keys(records[0] ?? {});
    const emailColumn = headers.find((h) => h.toLowerCase() === 'email');

    if (!emailColumn) {
      throw new BadRequestException('CSV must contain an "email" column');
    }

    const errors: Array<{ row: number; reason: string }> = [];
    let created = 0;
    let skipped = 0;

    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2;
      const row = records[i];

      if (!row) {
        errors.push({ row: rowNum, reason: 'Empty row' });
        continue;
      }

      const email = row[emailColumn]?.toLowerCase().trim();

      if (!email) {
        errors.push({ row: rowNum, reason: 'Email is empty' });
        continue;
      }

      if (!EMAIL_REGEX.test(email)) {
        errors.push({ row: rowNum, reason: 'Invalid email format' });
        continue;
      }

      const existing = await this.contactRepository.findByTenantIdAndEmail(tenantId, email);
      if (existing) {
        skipped++;
        continue;
      }

      const subscribedRaw = row['subscribed'];
      let subscribed = true;
      if (subscribedRaw) {
        const val = subscribedRaw.toLowerCase().trim();
        subscribed = val === 'true' || val === '1' || val === 'yes';
      }

      const metadata: Record<string, unknown> = {};
      for (const key of headers) {
        const lower = key.toLowerCase();
        if (lower !== 'email' && lower !== 'subscribed') {
          metadata[key] = row[key] || '';
        }
      }

      const contact = new Contact();
      contact.tenantId = tenantId;
      contact.email = email;
      contact.subscribed = subscribed;
      contact.metadata = Object.keys(metadata).length > 0 ? metadata : undefined;

      await this.contactRepository.save(contact);
      created++;

      if (created % BATCH_SIZE === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return { created, skipped, errors };
  }
}
