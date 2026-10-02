import type { Technician } from '@technician-map/shared';

const digits = (s: string): string => s.replace(/\D/g, '');

/** ค้นจากชื่อเล่น รหัส เบอร์โทร และชื่อจังหวัด (ฐานหรือไปได้) ไม่สนตัวพิมพ์เล็กใหญ่ */
export function filterTechnicians(
  list: readonly Technician[],
  query: string,
  provinceName: ReadonlyMap<string, string>,
): Technician[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...list];
  const qDigits = digits(q);
  return list.filter((t) => {
    const provinces = [...t.baseProvinces, ...t.serviceProvinces].map((c) => provinceName.get(c) ?? '');
    const texts = [t.nickname, t.code, t.phone, ...provinces].map((s) => s.toLowerCase());
    return texts.some((s) => s.includes(q)) || (qDigits.length >= 3 && digits(t.phone).includes(qDigits));
  });
}
