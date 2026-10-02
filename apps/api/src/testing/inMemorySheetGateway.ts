import type { SheetGateway } from '../infrastructure/sheetGateway';
import { FIRST_DATA_ROW } from '../infrastructure/sheetSchema';

export class InMemorySheetGateway implements SheetGateway {
  public writeCount = 0;
  private rows: string[][];

  constructor(initialRows: readonly (readonly string[])[] = []) {
    this.rows = initialRows.map((row) => [...row]);
  }

  readRows(): string[][] {
    return this.rows.map((row) => [...row]);
  }

  appendRow(values: readonly string[]): void {
    this.rows.push([...values]);
    this.writeCount += 1;
  }

  writeRow(sheetRow: number, values: readonly string[]): void {
    const index = sheetRow - FIRST_DATA_ROW;
    if (index < 0 || index >= this.rows.length) {
      throw new Error(`writeRow: ไม่มีแถว ${sheetRow}`);
    }
    this.rows[index] = [...values];
    this.writeCount += 1;
  }
}