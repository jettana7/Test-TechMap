import type { TechnicianInput } from '@technician-map/shared';

const FIELD_LABELS = {
  code: 'รหัส',
  nickname: 'ชื่อเล่น',
  phone: 'เบอร์โทร',
  color: 'สี',
  baseProvinces: 'จังหวัดฐาน',
  serviceProvinces: 'จังหวัดที่ไปได้',
} as const;

type TrackedField = keyof typeof FIELD_LABELS;

const FIELDS = Object.keys(FIELD_LABELS) as TrackedField[];

function toKey(value: string | readonly string[]): string {
  return typeof value === 'string' ? value : [...value].sort().join(',');
}

export function changedFieldLabels(before: TechnicianInput, after: TechnicianInput): string[] {
  return FIELDS.filter((field) => toKey(before[field]) !== toKey(after[field])).map(
    (field) => FIELD_LABELS[field],
  );
}