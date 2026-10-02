import type { Technician } from '@technician-map/shared';
import { formatProvinceList, parseProvinceList } from '../domain/provinceParser';
import { normalizeCoverage } from '../domain/technicianRules';
import { COLUMNS, cell, isBlankRow, type ColumnName } from './sheetSchema';

/** สีที่ใช้แสดงชั่วคราวเมื่อสีในชีตผิดรูปแบบ */
export const FALLBACK_COLOR = '#9E9E9E';

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const PHONE_PATTERN = /^[0-9+\-\s]*$/;

export function isValidColor(value: string): boolean {
  return COLOR_PATTERN.test(value);
}

export function isValidTimestamp(value: string): boolean {
  return value !== '' && !Number.isNaN(Date.parse(value));
}

export interface RowIssue {
  readonly sheetRow: number;
  readonly message: string;
}

export interface ParsedRow {
  readonly sheetRow: number;
  readonly raw: readonly string[];
  /** undefined เมื่อแถวว่าง หรือยังไม่มี id */
  readonly technician: Technician | undefined;
  readonly deleted: boolean;
  readonly issues: RowIssue[];
}

export function parseRow(row: readonly string[], sheetRow: number): ParsedRow {
  if (isBlankRow(row)) {
    return { sheetRow, raw: row, technician: undefined, deleted: false, issues: [] };
  }

  const issues: RowIssue[] = [];
  const report = (message: string): void => {
    issues.push({ sheetRow, message });
  };

  const id = cell(row, 'id');
  const code = cell(row, 'code');
  const nickname = cell(row, 'nickname');
  const phone = cell(row, 'phone');
  const colorRaw = cell(row, 'color');
  const updatedAt = cell(row, 'updatedAt');
  const deleted = cell(row, 'deletedAt') !== '';

  if (code === '') report('ยังไม่ได้ใส่รหัสช่าง');
  if (nickname === '') report('ยังไม่ได้ใส่ชื่อเล่น');
  if (!PHONE_PATTERN.test(phone)) report('เบอร์โทรมีอักขระที่ไม่ใช่ตัวเลข + -');
  if (colorRaw !== '' && !isValidColor(colorRaw)) {
    report(`สี "${colorRaw}" ไม่ถูกต้อง (ต้องเป็นรูปแบบ #RRGGBB)`);
  }

  const base = parseProvinceList(cell(row, 'baseProvinces'));
  const service = parseProvinceList(cell(row, 'serviceProvinces'));
  for (const name of base.unknown) report(`ไม่รู้จักจังหวัดฐาน "${name}"`);
  for (const name of service.unknown) report(`ไม่รู้จักจังหวัดที่ไปได้ "${name}"`);

  let technician: Technician | undefined;
  if (id === '') {
    report('แถวนี้ยังไม่มี id ระบบ (จะถูกเติมให้อัตโนมัติ)');
  } else {
    if (!isValidTimestamp(updatedAt)) report('เวลาแก้ไขล่าสุดไม่ถูกต้อง');
    const coverage = normalizeCoverage(base.codes, service.codes);
    technician = {
      id,
      code,
      nickname,
      phone,
      color: isValidColor(colorRaw) ? colorRaw.toUpperCase() : FALLBACK_COLOR,
      baseProvinces: coverage.baseProvinces,
      serviceProvinces: coverage.serviceProvinces,
      updatedAt,
      updatedBy: cell(row, 'updatedBy'),
    };
  }

  return { sheetRow, raw: row, technician, deleted, issues: deleted ? [] : issues };
}

export function technicianToRow(technician: Technician): string[] {
  const values: Record<ColumnName, string> = {
    code: technician.code,
    nickname: technician.nickname,
    phone: technician.phone,
    baseProvinces: formatProvinceList(technician.baseProvinces),
    serviceProvinces: formatProvinceList(technician.serviceProvinces),
    color: technician.color,
    id: technician.id,
    updatedAt: technician.updatedAt,
    updatedBy: technician.updatedBy,
    deletedAt: '',
    deletedBy: '',
  };
  return COLUMNS.map((name) => values[name]);
}