import { PROVINCES } from '@technician-map/shared';

/** รายการจังหวัดแบบ string ธรรมดา (ชนิดของ shared เป็น literal ที่เทียบกับ string ตรงๆ ไม่ได้) */
export const PROVINCE_LIST: readonly { readonly code: string; readonly nameTh: string }[] = PROVINCES;

export const PROVINCE_NAME: ReadonlyMap<string, string> = new Map(PROVINCE_LIST.map((p) => [p.code, p.nameTh]));
export const PROVINCE_CODE: ReadonlyMap<string, string> = new Map(PROVINCE_LIST.map((p) => [p.nameTh, p.code]));

export function has(codes: readonly string[], code: string): boolean {
  return codes.includes(code);
}
