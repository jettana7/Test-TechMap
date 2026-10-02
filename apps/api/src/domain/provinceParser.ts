import { PROVINCES, getProvinceName, type ProvinceCode } from '@technician-map/shared';

/** ชื่อเรียกอื่นที่พบบ่อย เพิ่มได้ที่นี่ที่เดียว (key ต้องเป็นข้อความที่ผ่าน normalize แล้ว) */
const ALIASES: Readonly<Record<string, ProvinceCode>> = {
  กทม: '10',
  กรุงเทพ: '10',
  โคราช: '30',
  อยุธยา: '14',
  ประจวบ: '77',
  นครศรี: '80',
  สุราษฎร์: '84',
};

const SEPARATORS = /[,;\n/]+/;

export function normalizeProvinceText(raw: string): string {
  return raw
    .normalize('NFC')
    .trim()
    .replace(/^(จังหวัด|จ\.)\s*/, '')
    .replace(/^จ\s+/, '')
    .replace(/\s+/g, '')
    .replace(/ฯ/g, '')
    .toLowerCase();
}

const LOOKUP: ReadonlyMap<string, ProvinceCode> = new Map<string, ProvinceCode>([
  ...PROVINCES.map((p): [string, ProvinceCode] => [normalizeProvinceText(p.nameTh), p.code]),
  ...Object.entries(ALIASES),
]);

export interface ParsedProvinces {
  readonly codes: ProvinceCode[];
  readonly unknown: string[];
}

export function parseProvinceList(raw: string): ParsedProvinces {
  const codes: ProvinceCode[] = [];
  const unknown: string[] = [];

  for (const token of raw.split(SEPARATORS)) {
    const trimmed = token.trim();
    if (trimmed === '') continue;

    const code = LOOKUP.get(normalizeProvinceText(trimmed));
    if (code === undefined) {
      if (!unknown.includes(trimmed)) unknown.push(trimmed);
    } else if (!codes.includes(code)) {
      codes.push(code);
    }
  }

  return { codes, unknown };
}

export function formatProvinceList(codes: readonly ProvinceCode[]): string {
  return codes.map((code) => getProvinceName(code)).join(', ');
}