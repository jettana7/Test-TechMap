import type { Technician } from '@technician-map/shared';
import { describe, expect, it } from 'vitest';
import {
  CreateTechnician,
  DeleteTechnician,
  ListTechnicians,
  UpdateTechnician,
} from '../application/technicianUseCases';
import { COLOR_PALETTE } from '../domain/colorPalette';
import { DomainError } from '../domain/errors';
import { InMemorySheetGateway } from '../testing/inMemorySheetGateway';
import { FakeClock, InMemoryAuditLog, SequentialIds } from '../testing/inMemoryAdapters';
import { SheetRowNormalizer } from './SheetRowNormalizer';
import { SheetTechnicianRepository } from './SheetTechnicianRepository';
import { parseRow, technicianToRow } from './sheetRowMapper';
import { withCells, type ColumnName } from './sheetSchema';

function row(partial: Partial<Record<ColumnName, string>>): string[] {
  return withCells([], partial);
}

function tech(n: number): Technician {
  return {
    id: `t${n}`,
    code: `0${n}`,
    nickname: `ช่าง${n}`,
    phone: '',
    color: '#E53935',
    baseProvinces: ['73'],
    serviceProvinces: [],
    updatedAt: '2025-01-01T00:00:00.000Z',
    updatedBy: 'seed',
  };
}

const completeRow = {
  code: '09',
  nickname: 'ใหม่',
  phone: '081',
  baseProvinces: 'จ.นครปฐม, สุพรรณบุรี',
  serviceProvinces: 'อุบลราชธานี',
  color: '#e91e63',
  id: 'a',
  updatedAt: '2025-01-01T00:00:00.000Z',
  updatedBy: 'x',
};

describe('parseRow', () => {
  it('แถวว่างไม่ใช่ช่างและไม่มี issue', () => {
    const result = parseRow(row({}), 2);
    expect(result.technician).toBeUndefined();
    expect(result.issues).toEqual([]);
  });

  it('แถวที่ยังไม่มี id ไม่ถูกนับเป็นช่าง แต่แจ้ง issue', () => {
    const result = parseRow(row({ code: '09', nickname: 'ใหม่' }), 5);
    expect(result.technician).toBeUndefined();
    expect(result.issues.some((i) => i.sheetRow === 5 && i.message.includes('id'))).toBe(true);
  });

  it('แปลงแถวที่สมบูรณ์ (จ., ชื่อจังหวัด, สีตัวพิมพ์เล็ก)', () => {
    const result = parseRow(row(completeRow), 2);
    expect(result.technician?.baseProvinces).toEqual(['73', '72']);
    expect(result.technician?.serviceProvinces).toEqual(['34']);
    expect(result.technician?.color).toBe('#E91E63');
    expect(result.issues).toEqual([]);
  });

  it('จังหวัดที่ไม่รู้จักกลายเป็น issue ไม่ทำให้พัง', () => {
    const result = parseRow(row({ ...completeRow, serviceProvinces: 'ซซซ' }), 2);
    expect(result.technician).toBeDefined();
    expect(result.issues.some((i) => i.message.includes('ซซซ'))).toBe(true);
  });

  it('แถวที่มี deletedAt ถือว่าถูกลบและไม่แจ้ง issue', () => {
    const result = parseRow(
      row({ ...completeRow, code: '', deletedAt: '2025-02-01T00:00:00.000Z' }),
      2,
    );
    expect(result.deleted).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('จังหวัดที่เป็นฐานแล้วถูกตัดออกจากรายการที่ไปได้', () => {
    const result = parseRow(
      row({ ...completeRow, baseProvinces: 'นครปฐม', serviceProvinces: 'นครปฐม, สุพรรณบุรี' }),
      2,
    );
    expect(result.technician?.serviceProvinces).toEqual(['72']);
  });
});

describe('technicianToRow', () => {
  it('แปลงไปกลับแล้วได้ข้อมูลเดิม และเก็บเลข 0 นำหน้า', () => {
    const original: Technician = {
      ...tech(1),
      code: '088',
      phone: '081-234-5678',
      baseProvinces: ['73', '72'],
      serviceProvinces: ['34'],
    };
    const result = parseRow(technicianToRow(original), 2).technician;
    expect(result).toEqual(original);
    expect(technicianToRow(original)[0]).toBe('088');
  });
});

describe('SheetTechnicianRepository', () => {
  it('insert แล้ว list ได้', () => {
    const repo = new SheetTechnicianRepository(new InMemorySheetGateway());
    repo.insert(tech(1));
    expect(repo.list()).toEqual([tech(1)]);
  });

  it('update เขียนทับแถวเดิม ไม่แตะแถวอื่น', () => {
    const gateway = new InMemorySheetGateway();
    const repo = new SheetTechnicianRepository(gateway);
    repo.insert(tech(1));
    repo.insert(tech(2));
    repo.update({ ...tech(2), nickname: 'แก้แล้ว' });
    expect(gateway.readRows()).toHaveLength(2);
    expect(repo.findById('t2')?.nickname).toBe('แก้แล้ว');
    expect(repo.findById('t1')?.nickname).toBe('ช่าง1');
  });

  it('softDelete ซ่อนจากรายการ แต่แถวยังอยู่ในชีต', () => {
    const gateway = new InMemorySheetGateway();
    const repo = new SheetTechnicianRepository(gateway);
    repo.insert(tech(1));
    repo.softDelete('t1', '2025-03-01T00:00:00.000Z', 'สมชาย');
    expect(repo.list()).toEqual([]);
    expect(repo.findById('t1')).toBeUndefined();
    expect(gateway.readRows()).toHaveLength(1);
    expect(gateway.readRows()[0]?.[9]).toBe('2025-03-01T00:00:00.000Z');
  });

  it('อ่านแถวที่คนพิมพ์เองใน Sheet ได้', () => {
    const repo = new SheetTechnicianRepository(new InMemorySheetGateway([row(completeRow)]));
    const [found] = repo.list();
    expect(found?.baseProvinces).toEqual(['73', '72']);
    expect(found?.color).toBe('#E91E63');
  });

  it('snapshot แจ้งรหัสซ้ำข้ามแถว', () => {
    const gateway = new InMemorySheetGateway([
      technicianToRow(tech(1)),
      technicianToRow({ ...tech(1), id: 't9' }),
    ]);
    const { issues } = new SheetTechnicianRepository(gateway).snapshot();
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.message.includes('ซ้ำ'))).toBe(true);
  });

  it('use cases ทำงานกับ Sheet repository ได้ครบ (สร้าง/แก้/ชนกัน/ลบ)', () => {
    const gateway = new InMemorySheetGateway();
    const deps = {
      repository: new SheetTechnicianRepository(gateway),
      clock: new FakeClock(),
      ids: new SequentialIds(),
      audit: new InMemoryAuditLog(),
    };
    const input = {
      code: '088',
      nickname: 'xo',
      phone: '081-234-5678',
      baseProvinces: ['34'],
      serviceProvinces: ['35'],
    };

    const created = new CreateTechnician(deps).execute(input, 'สมชาย');
    expect(new ListTechnicians(deps).execute()).toEqual([created]);

    const update = new UpdateTechnician(deps);
    const base = { id: created.id, expectedUpdatedAt: created.updatedAt };
    const updated = update.execute(
      { ...base, data: { ...input, color: created.color, nickname: 'xo2' } },
      'สมหญิง',
    );
    expect(updated.nickname).toBe('xo2');
    expect(() =>
      update.execute({ ...base, data: { ...input, color: created.color, nickname: 'B' } }, 'B'),
    ).toThrow(DomainError);

    new DeleteTechnician(deps).execute(created.id, 'สมชาย');
    expect(new ListTechnicians(deps).execute()).toEqual([]);
  });
});

describe('SheetRowNormalizer', () => {
  it('เติม id, สี, เวลา, ผู้แก้ ให้แถวที่พิมพ์เอง', () => {
    const gateway = new InMemorySheetGateway([
      row({ code: '09', nickname: 'ใหม่', baseProvinces: 'นครปฐม' }),
    ]);
    const normalizer = new SheetRowNormalizer(gateway, new FakeClock(), new SequentialIds());
    expect(normalizer.fillMissing('Sheet')).toBe(1);

    const repo = new SheetTechnicianRepository(gateway);
    const [found] = repo.list();
    expect(found?.id).toBe('id-1');
    expect(found?.color).toBe(COLOR_PALETTE[0]);
    expect(found?.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(found?.updatedBy).toBe('Sheet');
  });

  it('เลือกสีที่ยังไม่ถูกใช้ให้แถวใหม่', () => {
    const gateway = new InMemorySheetGateway([
      technicianToRow(tech(1)),
      row({ code: '09', nickname: 'ใหม่' }),
    ]);
    new SheetRowNormalizer(gateway, new FakeClock(), new SequentialIds()).fillMissing('Sheet');
    const colors = new SheetTechnicianRepository(gateway).list().map((t) => t.color);
    expect(colors).toEqual(['#E53935', COLOR_PALETTE[1]]);
  });

  it('แถวที่สมบูรณ์อยู่แล้วจะไม่ถูกเขียนซ้ำ', () => {
    const gateway = new InMemorySheetGateway([technicianToRow(tech(1)), technicianToRow(tech(2))]);
    const normalizer = new SheetRowNormalizer(gateway, new FakeClock(), new SequentialIds());
    expect(normalizer.fillMissing('Sheet')).toBe(0);
    expect(gateway.writeCount).toBe(0);
  });

  it('ข้ามแถวว่าง', () => {
    const gateway = new InMemorySheetGateway([row({})]);
    const normalizer = new SheetRowNormalizer(gateway, new FakeClock(), new SequentialIds());
    expect(normalizer.fillMissing('Sheet')).toBe(0);
  });

  it('touch ปรับเฉพาะแถวในช่วงที่กำหนด', () => {
    const gateway = new InMemorySheetGateway([
      technicianToRow(tech(1)),
      technicianToRow(tech(2)),
      technicianToRow(tech(3)),
    ]);
    const normalizer = new SheetRowNormalizer(gateway, new FakeClock(), new SequentialIds());
    expect(normalizer.touch(3, 3, 'สมหญิง')).toBe(1);

    const [first, second, third] = new SheetTechnicianRepository(gateway).list();
    expect(second?.updatedBy).toBe('สมหญิง');
    expect(second?.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(first?.updatedBy).toBe('seed');
    expect(third?.updatedBy).toBe('seed');
  });
});