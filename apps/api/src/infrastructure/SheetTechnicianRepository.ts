import type { Technician } from '@technician-map/shared';
import type { TechnicianRepository } from '../application/ports';
import { findDuplicateIssues } from './sheetDiagnostics';
import type { SheetGateway } from './sheetGateway';
import { parseRow, technicianToRow, type ParsedRow, type RowIssue } from './sheetRowMapper';
import { FIRST_DATA_ROW, withCells } from './sheetSchema';

export interface SheetSnapshot {
  readonly technicians: Technician[];
  readonly issues: RowIssue[];
}

export class SheetTechnicianRepository implements TechnicianRepository {
  constructor(private readonly gateway: SheetGateway) {}

  snapshot(): SheetSnapshot {
    const rows = this.parseAll();
    const technicians: Technician[] = [];
    for (const row of rows) {
      if (!row.deleted && row.technician !== undefined) technicians.push(row.technician);
    }
    const issues = [...rows.flatMap((row) => row.issues), ...findDuplicateIssues(rows)];
    return { technicians, issues };
  }

  list(): Technician[] {
    return this.snapshot().technicians;
  }

  findById(id: string): Technician | undefined {
    return this.list().find((t) => t.id === id);
  }

  insert(technician: Technician): void {
    this.gateway.appendRow(technicianToRow(technician));
  }

  update(technician: Technician): void {
    const target = this.locate(technician.id);
    this.gateway.writeRow(target.sheetRow, technicianToRow(technician));
  }

  softDelete(id: string, deletedAt: string, deletedBy: string): void {
    const target = this.locate(id);
    this.gateway.writeRow(target.sheetRow, withCells(target.raw, { deletedAt, deletedBy }));
  }

  private parseAll(): ParsedRow[] {
    return this.gateway
      .readRows()
      .map((row, index) => parseRow(row, FIRST_DATA_ROW + index));
  }

  private locate(id: string): ParsedRow {
    const found = this.parseAll().find((row) => !row.deleted && row.technician?.id === id);
    if (found === undefined) throw new Error(`ไม่พบแถวของช่าง id ${id} ในชีต`);
    return found;
  }
}