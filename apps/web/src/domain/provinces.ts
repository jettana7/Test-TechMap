import { PROVINCES } from '@technician-map/shared';
import type { MessageKey } from './i18n';

/** รายการจังหวัดแบบ string ธรรมดา (ชนิดของ shared เป็น literal ที่เทียบกับ string ตรงๆ ไม่ได้) */
export const PROVINCE_LIST: readonly { readonly code: string; readonly nameTh: string }[] = PROVINCES;

export const PROVINCE_NAME: ReadonlyMap<string, string> = new Map(PROVINCE_LIST.map((p) => [p.code, p.nameTh]));
export const PROVINCE_CODE: ReadonlyMap<string, string> = new Map(PROVINCE_LIST.map((p) => [p.nameTh, p.code]));

export function has(codes: readonly string[], code: string): boolean {
  return codes.includes(code);
}

export interface RegionGroup {
  readonly key: MessageKey;
  readonly codes: readonly string[];
}

export const REGION_GROUPS: readonly RegionGroup[] = [
  { key: 'regionBkkMetro', codes: ['10', '11', '12', '13', '73', '74'] },
  { key: 'regionEast', codes: ['20', '21', '22', '23', '24', '25', '27'] },
  { key: 'regionCentral', codes: ['14', '15', '16', '17', '18', '19', '26', '60', '61', '62', '64', '65', '66', '67', '72', '75'] },
  { key: 'regionWest', codes: ['63', '70', '71', '76', '77'] },
  { key: 'regionNorth', codes: ['50', '51', '52', '53', '54', '55', '56', '57', '58'] },
  { key: 'regionNortheast', codes: ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49'] },
  { key: 'regionSouth', codes: ['80', '81', '82', '83', '84', '85', '86', '90', '91', '92', '93', '94', '95', '96'] },
];
