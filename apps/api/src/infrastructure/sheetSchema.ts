export const COLUMNS = [
  'code',
  'nickname',
  'phone',
  'baseProvinces',
  'serviceProvinces',
  'color',
  'id',
  'updatedAt',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const;

export type ColumnName = (typeof COLUMNS)[number];

export const COLUMN_COUNT = COLUMNS.length;

/** แถวที่ 1 คือหัวตาราง ข้อมูลเริ่มที่แถวที่ 2 */
export const FIRST_DATA_ROW = 2;

/** ข้อความหัวตารางที่แสดงในชีต (ใช้ตำแหน่งคอลัมน์ในการอ่าน ไม่ใช้ข้อความนี้) */
export const HEADER_LABELS: readonly string[] = [
  'รหัส',
  'ชื่อเล่น',
  'เบอร์โทร',
  'จังหวัดฐาน',
  'จังหวัดที่ไปได้',
  'สี',
  'id (ระบบ)',
  'แก้ไขล่าสุด (ระบบ)',
  'แก้ไขโดย (ระบบ)',
  'ลบเมื่อ',
  'ลบโดย',
];

export function columnIndex(name: ColumnName): number {
  return COLUMNS.indexOf(name);
}

export function padRow(row: readonly string[]): string[] {
  return COLUMNS.map((_, index) => row[index] ?? '');
}

export function cell(row: readonly string[], name: ColumnName): string {
  return (row[columnIndex(name)] ?? '').trim();
}

export function withCells(
  row: readonly string[],
  updates: Partial<Record<ColumnName, string>>,
): string[] {
  const copy = padRow(row);
  for (const name of COLUMNS) {
    const value = updates[name];
    if (value !== undefined) copy[columnIndex(name)] = value;
  }
  return copy;
}

const CONTENT_COLUMNS: readonly ColumnName[] = [
  'code',
  'nickname',
  'phone',
  'baseProvinces',
  'serviceProvinces',
  'id',
];

/** แถวที่ไม่มีข้อมูลช่างเลย (ไม่นับคอลัมน์ระบบอย่างสี/เวลา) */
export function isBlankRow(row: readonly string[]): boolean {
  return CONTENT_COLUMNS.every((name) => cell(row, name) === '');
}