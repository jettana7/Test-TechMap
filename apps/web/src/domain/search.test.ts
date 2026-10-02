import type { Technician } from '@technician-map/shared';
import { describe, expect, it } from 'vitest';
import { filterTechnicians } from './search';

const table: Record<string, string[]> = {
  '34': ['นครปฐม', 'Nakhon Pathom', '佛统府'],
  '35': ['สุพรรณบุรี', 'Suphan Buri'],
  '10': ['กรุงเทพมหานคร', 'Bangkok'],
};
const names = (code: string): string[] => table[code] ?? [];
const make = (id: string, over: Partial<Technician>): Technician => ({
  id, code: id, nickname: id, phone: '', color: '#112233',
  baseProvinces: [], serviceProvinces: [], updatedAt: '2026-01-01T00:00:00.000Z', updatedBy: 'x', ...over,
}) as Technician;

const list = [
  make('088', { nickname: 'XO', phone: '081-234-5678', baseProvinces: ['34'], serviceProvinces: ['35'] }),
  make('007', { nickname: 'บอส', baseProvinces: ['10'] }),
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
    expect(filterTechnicians(list, '佛统', names).map((t) => t.id)).toEqual(['088']);
  });
  it('ไม่เจอคืนว่าง', () => expect(filterTechnicians(list, 'zzz', names)).toEqual([]));
});
