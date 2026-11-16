import type { Technician } from '@technician-map/shared';
import { has } from './provinces';

export type StatusFilter = 'available' | 'unavailable' | 'all';

const digits = (s: string): string => s.replace(/\D/g, '');
const isAvailable = (t: Technician): boolean => t.available !== false;

export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIsoDate(days: number, now: Date = new Date()): string {
  const target = new Date(now);
  target.setDate(target.getDate() + days);
  return todayIsoDate(target);
}

/**
 * หากตั้งวันที่กลับมาว่างไว้ และวันนี้ถึงหรือเลยวันนั้นแล้ว ถือว่ากลับมาพร้อมรับงานอัตโนมัติ
 */
export function isUnavailableExpired(
  unavailableUntil: string | undefined,
  today: string = todayIsoDate(),
): boolean {
  if (!unavailableUntil || !/^\d{4}-\d{2}-\d{2}$/.test(unavailableUntil)) return false;
  return today >= unavailableUntil;
}

export function filterByStatus(list: readonly Technician[], status: StatusFilter): Technician[] {
  if (status === 'all') return [...list];
  const wantAvailable = status === 'available';
  return list.filter((t) => isAvailable(t) === wantAvailable);
}

/**
 * เรียงลำดับช่าง:
 * - หากเลือกจังหวัดอยู่ ให้เอาช่างที่ "ประจำจังหวัดนั้น" ขึ้นก่อนช่างที่ "เดินทางไปได้"
 * - ช่างที่ "พร้อมรับงาน" อยู่ก่อนช่างที่ "ไม่ว่าง"
 */
export function sortTechnicians(
  list: readonly Technician[],
  selectedProvince?: string,
): Technician[] {
  return [...list].sort((a, b) => {
    if (selectedProvince !== undefined) {
      const aBase = has(a.baseProvinces, selectedProvince) ? 0 : 1;
      const bBase = has(b.baseProvinces, selectedProvince) ? 0 : 1;
      if (aBase !== bBase) return aBase - bBase;
    }
    const aReady = isAvailable(a) ? 0 : 1;
    const bReady = isAvailable(b) ? 0 : 1;
    return aReady - bReady;
  });
}

/**
 * ค้นจากชื่อเล่น รหัส เบอร์โทร สาเหตุที่ไม่ว่าง หมายเหตุ และชื่อจังหวัด (ฐานหรือไปได้) ไม่สนตัวพิมพ์เล็กใหญ่
 * provinceNames คืนทุกชื่อของจังหวัด (ทุกภาษา) จึงพิมพ์ภาษาไหนก็เจอ
 */
export function filterTechnicians(
  list: readonly Technician[],
  query: string,
  provinceNames: (code: string) => readonly string[],
): Technician[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...list];
  const qDigits = digits(q);
  return list.filter((t) => {
    const provinces = [...t.baseProvinces, ...t.serviceProvinces].flatMap(provinceNames);
    const texts = [
      t.nickname,
      t.code,
      t.phone,
      t.unavailableReason ?? '',
      t.note ?? '',
      ...provinces,
    ].map((s) => s.toLowerCase());
    return texts.some((s) => s.includes(q)) || (qDigits.length >= 3 && digits(t.phone).includes(qDigits));
  });
}
