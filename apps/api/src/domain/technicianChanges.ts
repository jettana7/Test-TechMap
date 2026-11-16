import type { TechnicianInput } from '@technician-map/shared';

const FIELD_LABELS = {
  code: 'รหัส',
  nickname: 'ชื่อเล่น',
  phone: 'เบอร์โทร',
  color: 'สี',
  baseProvinces: 'จังหวัดฐาน',
  serviceProvinces: 'จังหวัดที่ไปได้',
  available: 'สถานะ',
  unavailableReason: 'สาเหตุที่ไม่ว่าง',
  unavailableUntil: 'กลับมาว่างวันที่',
  note: 'หมายเหตุ',
} as const;

type TrackedField = keyof typeof FIELD_LABELS;

const FIELDS = Object.keys(FIELD_LABELS) as TrackedField[];

function toKey(value: string | boolean | readonly string[]): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return typeof value === 'string' ? value : [...value].sort().join(',');
}

export function changedFieldLabels(before: TechnicianInput, after: TechnicianInput): string[] {
  return FIELDS.filter((field) => toKey(before[field]) !== toKey(after[field])).map(
    (field) => FIELD_LABELS[field],
  );
}
