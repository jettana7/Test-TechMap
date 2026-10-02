import { describe, expect, it } from 'vitest';
import { COLOR_PALETTE, pickColor } from './colorPalette';
import { DomainError } from './errors';
import { formatProvinceList, parseProvinceList } from './provinceParser';
import { assertCodeUnique, normalizeCoverage } from './technicianRules';

describe('parseProvinceList', () => {
  it('แปลงชื่อจังหวัดพร้อมคำนำหน้า จ.', () => {
    expect(parseProvinceList('จ.นครปฐม, สุพรรณบุรี').codes).toEqual(['73', '72']);
  });

  it('รองรับ จังหวัด, ช่องว่าง และชื่อย่อ', () => {
    expect(parseProvinceList('จังหวัด สมุทรสาคร').codes).toEqual(['74']);
    expect(parseProvinceList('กรุงเทพ').codes).toEqual(['10']);
    expect(parseProvinceList('กทม').codes).toEqual(['10']);
    expect(parseProvinceList('โคราช').codes).toEqual(['30']);
  });

  it('ไม่ตัดตัว จ ออกจากชื่อจังหวัดที่ขึ้นต้นด้วย จ', () => {
    expect(parseProvinceList('จันทบุรี').codes).toEqual(['22']);
    expect(parseProvinceList('จ.จันทบุรี').codes).toEqual(['22']);
  });

  it('ตัดชื่อซ้ำ', () => {
    expect(parseProvinceList('นครปฐม, นครปฐม').codes).toEqual(['73']);
  });

  it('แยกชื่อที่ไม่รู้จักออกมา ไม่ทำให้พัง', () => {
    const result = parseProvinceList('นครปฐม, ซซซ');
    expect(result.codes).toEqual(['73']);
    expect(result.unknown).toEqual(['ซซซ']);
  });

  it('ข้อความว่างได้ผลลัพธ์ว่าง', () => {
    expect(parseProvinceList('')).toEqual({ codes: [], unknown: [] });
  });

  it('formatProvinceList แปลงกลับเป็นชื่อ', () => {
    expect(formatProvinceList(['73', '72'])).toBe('นครปฐม, สุพรรณบุรี');
  });
});

describe('pickColor', () => {
  it('ยังไม่มีใครใช้ ได้สีแรก', () => {
    expect(pickColor([])).toBe(COLOR_PALETTE[0]);
  });

  it('เลือกสีที่ยังไม่ถูกใช้', () => {
    expect(pickColor([COLOR_PALETTE[0]])).toBe(COLOR_PALETTE[1]);
  });

  it('ไม่สนตัวพิมพ์เล็กใหญ่', () => {
    expect(pickColor([COLOR_PALETTE[0].toLowerCase()])).toBe(COLOR_PALETTE[1]);
  });

  it('ใช้ครบทุกสีแล้ว วนกลับมาสีแรก', () => {
    expect(pickColor([...COLOR_PALETTE])).toBe(COLOR_PALETTE[0]);
  });
});

describe('assertCodeUnique', () => {
  const existing = [{ id: 'a', code: '088' }];

  it('โยน error เมื่อรหัสซ้ำ (ไม่สนช่องว่างหน้าหลัง)', () => {
    expect(() => assertCodeUnique(' 088 ', existing)).toThrow(DomainError);
  });

  it('ผ่านเมื่อรหัสไม่ซ้ำ', () => {
    expect(() => assertCodeUnique('089', existing)).not.toThrow();
  });

  it('ผ่านเมื่อเป็นช่างคนเดิมที่กำลังแก้ไข', () => {
    expect(() => assertCodeUnique('088', existing, 'a')).not.toThrow();
  });
});

describe('normalizeCoverage', () => {
  it('จังหวัดที่เป็นฐานแล้ว ไม่ต้องอยู่ในรายการที่ไปได้ และตัดซ้ำ', () => {
    expect(normalizeCoverage(['73', '73'], ['73', '72', '72'])).toEqual({
      baseProvinces: ['73'],
      serviceProvinces: ['72'],
    });
  });
});