import type { SheetGateway } from '../sheetGateway';
import { COLUMN_COUNT, FIRST_DATA_ROW, padRow } from '../sheetSchema';
import { SHEET_TECHNICIANS } from './config';
import { getSheet } from './spreadsheetProvider';

const EXTRA_ROWS = 100;

export class SpreadsheetGateway implements SheetGateway {
  readRows(): string[][] {
    const sheet = getSheet(SHEET_TECHNICIANS);
    const lastRow = sheet.getLastRow();
    if (lastRow < FIRST_DATA_ROW) return [];
    return sheet
      .getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, COLUMN_COUNT)
      .getDisplayValues();
  }

  appendRow(values: readonly string[]): void {
    const sheet = getSheet(SHEET_TECHNICIANS);
    const nextRow = Math.max(sheet.getLastRow(), FIRST_DATA_ROW - 1) + 1;
    this.write(sheet, nextRow, values);
  }

  writeRow(sheetRow: number, values: readonly string[]): void {
    if (sheetRow < FIRST_DATA_ROW) {
      throw new Error(`writeRow: เลขแถว ${sheetRow} ไม่ใช่แถวข้อมูล`);
    }
    this.write(getSheet(SHEET_TECHNICIANS), sheetRow, values);
  }

  private write(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    row: number,
    values: readonly string[],
  ): void {
    if (row > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), EXTRA_ROWS);
    }
    sheet
      .getRange(row, 1, 1, COLUMN_COUNT)
      .setNumberFormat('@')
      .setValues([padRow(values)]);
  }
}