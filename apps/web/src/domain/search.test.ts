import type { Technician } from '@technician-map/shared';
import { describe, expect, it } from 'vitest';
import {
  filterByStatus,
  filterTechnicians,
  isUnavailableExpired,
  sortTechnicians,
} from './search';

const table: Record<string, string[]> = {
  '34': ['นครปฐม', 'Nakhon Pathom', '佛统府'],
  '35': ['สุพรรณบุรี', 'Suphan Buri'],
  '10': ['กรุงเทพมหานคร', 'Bangkok'],
};
const names = (code: string): string[] => table[code] ?? [];
const make = (id: string, over: Partial<Technician>): Technician => ({
  id, code: id, nickname: id, phone: '', color: '#112233',
  baseProvinces: [], serviceProvinces: [],
  available: true, unavailableReason: '', unavailableUntil: '', note: '',
  updatedAt: '2026-01-01T00:00:00.000Z', updatedBy: 'x', ...over,
}) as Technician;

const list = [
  make('088', { nickname: 'XO', phone: '081-234-5678', baseProvinces: ['34'], serviceProvinces: ['35'], note: 'มีรถกระเช้า' }),
  make('007', { nickname: 'บอส', baseProvinces: ['10'], serviceProvinces: ['34'], available: false, unavailableReason: 'ติดงานชลบุรี' }),
];

describe('filterTechnicians', () => {
  it('ค้นว่างคืนทั้งหมด', () => expect(filterTechnicians(list, '  ', names)).toHaveLength(2));
  it('ค้นชื่อเล่นโดยไม่สนตัวพิมพ์', () => expect(filterTechnicians(list, 'xo', names).map((t) => t.id)).toEqual(['088']));
  it('ค้นรหัสที่ขึ้นต้นด้วย 0', () => expect(filterTechnicians(list, '007', names).map((t) => t.id)).toEqual(['007']));
  it('ค้นเบอร์โทรไม่สนขีดและเว้นวรรค', () => expect(filterTechnicians(list, '0812345', names).map((t) => t.id)).toEqual(['088']));
  it('ค้นชื่อจังหวัดทั้งฐานและไปได้', () => {
    expect(filterTechnicians(list, 'สุพรรณ', names).map((t) => t.id)).toEqual(['088']);
    expect(filterTechnicians(list, 'กรุงเทพ', names).map((t) => t.id)).toEqual(['007']);
  });
  it('ค้นชื่อจังหวัดภาษาอังกฤษและจีนได้', () => {
    expect(filterTechnicians(list, 'bangkok', names).map((t) => t.id)).toEqual(['007']);
    expect(filterTechnicians(list, '佛统', names).map((t) => t.id)).toEqual(['088', '007']);
  });
  it('ค้นสาเหตุที่ไม่ว่างและหมายเหตุได้', () => {
    expect(filterTechnicians(list, 'ชลบุรี', names).map((t) => t.id)).toEqual(['007']);
    expect(filterTechnicians(list, 'รถกระเช้า', names).map((t) => t.id)).toEqual(['088']);
  });
  it('ไม่เจอคืนว่าง', () => expect(filterTechnicians(list, 'zzz', names)).toEqual([]));
});

describe('filterByStatus & sortTechnicians', () => {
  it('กรองตามสถานะ available / unavailable / all', () => {
    expect(filterByStatus(list, 'available').map((t) => t.id)).toEqual(['088']);
    expect(filterByStatus(list, 'unavailable').map((t) => t.id)).toEqual(['007']);
    expect(filterByStatus(list, 'all').map((t) => t.id)).toEqual(['088', '007']);
  });

  it('เรียงช่างประจำจังหวัดขึ้นก่อนช่างที่ไปให้บริการได้', () => {
    const items = [
      make('service-tech', { baseProvinces: ['10'], serviceProvinces: ['34'] }),
      make('base-tech', { baseProvinces: ['34'], serviceProvinces: [] }),
    ];
    expect(sortTechnicians(items, '34').map((t) => t.id)).toEqual(['base-tech', 'service-tech']);
  });

  it('ตรวจวันกลับมาว่างอัตโนมัติ (isUnavailableExpired)', () => {
    expect(isUnavailableExpired('2026-11-16', '2026-11-16')).toBe(true);
    expect(isUnavailableExpired('2026-11-15', '2026-11-16')).toBe(true);
    expect(isUnavailableExpired('2026-11-17', '2026-11-16')).toBe(false);
    expect(isUnavailableExpired('', '2026-11-16')).toBe(false);
  });
});
