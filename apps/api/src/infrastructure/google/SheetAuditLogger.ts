import type { AuditEntry, AuditLogger } from '../../application/ports';
import { SHEET_AUDIT } from './config';
import { getSheet } from './spreadsheetProvider';

export class SheetAuditLogger implements AuditLogger {
  record(entry: AuditEntry): void {
    try {
      const sheet = getSheet(SHEET_AUDIT);
      const row = Math.max(sheet.getLastRow(), 1) + 1;
      sheet
        .getRange(row, 1, 1, 5)
        .setNumberFormat('@')
        .setValues([[entry.timestamp, entry.actor, entry.action, entry.technicianId, entry.summary]]);
    } catch (error) {
      Logger.log(`บันทึก AuditLog ไม่สำเร็จ: ${String(error)}`);
    }
  }
}