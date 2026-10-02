import type { Clock, IdGenerator } from '../application/ports';
import { pickColor } from '../domain/colorPalette';
import type { SheetGateway } from './sheetGateway';
import { isValidColor, isValidTimestamp } from './sheetRowMapper';
import { FIRST_DATA_ROW, cell, isBlankRow, withCells, type ColumnName } from './sheetSchema';

export class SheetRowNormalizer {
  constructor(
    private readonly gateway: SheetGateway,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /** เติมค่าที่ขาดให้แถวที่พิมพ์เอง คืนจำนวนแถวที่ถูกเขียน */
  fillMissing(actor: string): number {
    const rows = this.gateway.readRows();
    const usedColors = rows.map((row) => cell(row, 'color')).filter(isValidColor);
    let written = 0;

    for (const [index, raw] of rows.entries()) {
      if (isBlankRow(raw)) continue;

      const updates: Partial<Record<ColumnName, string>> = {};
      if (cell(raw, 'id') === '') updates.id = this.ids.next();
      if (!isValidColor(cell(raw, 'color'))) {
        const color = pickColor(usedColors);
        usedColors.push(color);
        updates.color = color;
      }
      if (!isValidTimestamp(cell(raw, 'updatedAt'))) updates.updatedAt = this.clock.nowIso();
      if (cell(raw, 'updatedBy') === '') updates.updatedBy = actor;

      if (Object.keys(updates).length === 0) continue;
      this.gateway.writeRow(FIRST_DATA_ROW + index, withCells(raw, updates));
      written += 1;
    }
    return written;
  }

  /** ปรับเวลาและผู้แก้ของแถวในช่วงที่กำหนด (เลขแถวจริงในชีต) คืนจำนวนแถวที่ถูกเขียน */
  touch(firstSheetRow: number, lastSheetRow: number, actor: string): number {
    const rows = this.gateway.readRows();
    const now = this.clock.nowIso();
    let written = 0;

    for (const [index, raw] of rows.entries()) {
      const sheetRow = FIRST_DATA_ROW + index;
      if (sheetRow < firstSheetRow || sheetRow > lastSheetRow || isBlankRow(raw)) continue;
      this.gateway.writeRow(sheetRow, withCells(raw, { updatedAt: now, updatedBy: actor }));
      written += 1;
    }
    return written;
  }
}