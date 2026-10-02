import { describe, expect, it } from 'vitest';
import { PROVINCES, isProvinceCode } from './provinces';
import { technicianInputSchema } from './technician';

describe('PROVINCES', () => {
  it('มี 77 จังหวัด', () => {
    expect(PROVINCES).toHaveLength(77);
  });

  it('รหัสและชื่อไม่ซ้ำ', () => {
    expect(new Set(PROVINCES.map((p) => p.code)).size).toBe(77);
    expect(new Set(PROVINCES.map((p) => p.nameTh)).size).toBe(77);
  });

  it('ตรวจรหัสจังหวัดได้ถูกต้อง', () => {
    expect(isProvinceCode('10')).toBe(true);
    expect(isProvinceCode('99')).toBe(false);
  });
});

describe('technicianInputSchema', () => {
  const valid = {
    code: '088',
    nickname: 'xo',
    phone: '081-234-5678',
    color: '#E91E63',
    baseProvinces: ['34'],
    serviceProvinces: ['35', '36'],
  };

  it('ยอมรับข้อมูลที่ถูกต้อง และเก็บรหัสที่ขึ้นต้นด้วย 0', () => {
    const result = technicianInputSchema.parse(valid);
    expect(result.code).toBe('088');
  });

  it('ปฏิเสธรหัสจังหวัดที่ไม่มีอยู่จริง', () => {
    expect(technicianInputSchema.safeParse({ ...valid, baseProvinces: ['99'] }).success).toBe(false);
  });

  it('ปฏิเสธเบอร์โทรที่มีตัวอักษร', () => {
    expect(technicianInputSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false);
  });
});