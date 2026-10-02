import type { Technician } from '@technician-map/shared';
import { normalizeCode } from '../domain/technicianRules';
import type { ParsedRow, RowIssue } from './sheetRowMapper';

function collectDuplicates(
  rows: readonly ParsedRow[],
  keyOf: (technician: Technician) => string,
  describe: (key: string, otherRows: number[]) => string,
): RowIssue[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    if (row.deleted || row.technician === undefined) continue;
    const key = keyOf(row.technician);
    if (key === '') continue;
    groups.set(key, [...(groups.get(key) ?? []), row.sheetRow]);
  }

  const issues: RowIssue[] = [];
  for (const [key, sheetRows] of groups) {
    if (sheetRows.length < 2) continue;
    for (const sheetRow of sheetRows) {
      const others = sheetRows.filter((n) => n !== sheetRow);
      issues.push({ sheetRow, message: describe(key, others) });
    }
  }
  return issues;
}

export function findDuplicateIssues(rows: readonly ParsedRow[]): RowIssue[] {
  return [
    ...collectDuplicates(
      rows,
      (t) => normalizeCode(t.code),
      (key, others) => `รหัส "${key}" ซ้ำกับแถว ${others.join(', ')}`,
    ),
    ...collectDuplicates(
      rows,
      (t) => t.id,
      (_key, others) => `id ซ้ำกับแถว ${others.join(', ')} (มักเกิดจากการคัดลอกแถว)`,
    ),
  ];
}