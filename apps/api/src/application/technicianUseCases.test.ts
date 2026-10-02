import { describe, expect, it } from 'vitest';
import { COLOR_PALETTE } from '../domain/colorPalette';
import { DomainError } from '../domain/errors';
import {
  FakeClock,
  InMemoryAuditLog,
  InMemoryTechnicianRepository,
  SequentialIds,
} from '../testing/inMemoryAdapters';
import {
  CreateTechnician,
  DeleteTechnician,
  ListTechnicians,
  UpdateTechnician,
} from './technicianUseCases';

function setup() {
  const repo = new InMemoryTechnicianRepository();
  const audit = new InMemoryAuditLog();
  const deps = { repository: repo, clock: new FakeClock(), ids: new SequentialIds(), audit };
  return {
    repo,
    audit,
    list: new ListTechnicians(deps),
    create: new CreateTechnician(deps),
    update: new UpdateTechnician(deps),
    remove: new DeleteTechnician(deps),
  };
}

const input = {
  code: '088',
  nickname: 'xo',
  phone: '081-234-5678',
  baseProvinces: ['34'],
  serviceProvinces: ['35'],
};

function expectDomainError(fn: () => unknown, code: string): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe(code);
    return;
  }
  throw new Error(`คาดว่าจะเกิด DomainError ${code} แต่ไม่เกิด`);
}

describe('CreateTechnician', () => {
  it('สร้างช่างพร้อม id, สีอัตโนมัติ และผู้แก้ไข', () => {
    const { create, list } = setup();
    const created = create.execute(input, 'สมชาย');
    expect(created.id).toBe('id-1');
    expect(created.code).toBe('088');
    expect(created.color).toBe(COLOR_PALETTE[0]);
    expect(created.updatedBy).toBe('สมชาย');
    expect(list.execute()).toHaveLength(1);
  });

  it('ช่างคนที่สองได้สีต่างจากคนแรก', () => {
    const { create } = setup();
    const first = create.execute(input, 'สมชาย');
    const second = create.execute({ ...input, code: '089' }, 'สมชาย');
    expect(second.color).not.toBe(first.color);
  });

  it('ใช้สีที่ระบุมา และแปลงเป็นตัวพิมพ์ใหญ่', () => {
    const { create } = setup();
    expect(create.execute({ ...input, color: '#e91e63' }, 'สมชาย').color).toBe('#E91E63');
  });

  it('จังหวัดที่เป็นฐานแล้วไม่อยู่ในรายการที่ไปได้', () => {
    const { create } = setup();
    const created = create.execute(
      { ...input, baseProvinces: ['73'], serviceProvinces: ['73', '72'] },
      'สมชาย',
    );
    expect(created.serviceProvinces).toEqual(['72']);
  });

  it('ปฏิเสธรหัสซ้ำ', () => {
    const { create } = setup();
    create.execute(input, 'สมชาย');
    expectDomainError(() => create.execute(input, 'สมชาย'), 'DUPLICATE_CODE');
  });

  it('ปฏิเสธข้อมูลที่ไม่ถูกต้อง', () => {
    const { create } = setup();
    expectDomainError(() => create.execute({ ...input, code: '' }, 'สมชาย'), 'VALIDATION');
  });

  it('ปฏิเสธเมื่อไม่มีชื่อผู้ใช้งาน', () => {
    const { create } = setup();
    expectDomainError(() => create.execute(input, '   '), 'VALIDATION');
  });

  it('บันทึก AuditLog', () => {
    const { create, audit } = setup();
    const created = create.execute(input, 'สมชาย');
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]?.action).toBe('CREATE');
    expect(audit.entries[0]?.actor).toBe('สมชาย');
    expect(audit.entries[0]?.technicianId).toBe(created.id);
  });
});

describe('UpdateTechnician', () => {
  it('แก้ไขได้ และ updatedAt, updatedBy เปลี่ยน', () => {
    const { create, update, repo } = setup();
    const created = create.execute(input, 'สมชาย');
    const updated = update.execute(
      {
        id: created.id,
        expectedUpdatedAt: created.updatedAt,
        data: { ...input, color: created.color, nickname: 'xo2' },
      },
      'สมหญิง',
    );
    expect(updated.nickname).toBe('xo2');
    expect(updated.updatedAt).not.toBe(created.updatedAt);
    expect(updated.updatedBy).toBe('สมหญิง');
    expect(repo.findById(created.id)?.nickname).toBe('xo2');
  });

  it('แจ้ง CONFLICT เมื่อมีคนแก้ตัดหน้า', () => {
    const { create, update } = setup();
    const created = create.execute(input, 'สมชาย');
    const base = { id: created.id, expectedUpdatedAt: created.updatedAt };
    update.execute({ ...base, data: { ...input, color: created.color, nickname: 'A' } }, 'A');
    expectDomainError(
      () => update.execute({ ...base, data: { ...input, color: created.color, nickname: 'B' } }, 'B'),
      'CONFLICT',
    );
  });

  it('แจ้ง NOT_FOUND เมื่อไม่มีช่างคนนี้', () => {
    const { update } = setup();
    expectDomainError(
      () =>
        update.execute(
          { id: 'ไม่มี', expectedUpdatedAt: 'x', data: { ...input, color: '#E53935' } },
          'สมชาย',
        ),
      'NOT_FOUND',
    );
  });

  it('ปฏิเสธการแก้รหัสให้ซ้ำกับช่างคนอื่น', () => {
    const { create, update } = setup();
    create.execute(input, 'สมชาย');
    const second = create.execute({ ...input, code: '089' }, 'สมชาย');
    expectDomainError(
      () =>
        update.execute(
          {
            id: second.id,
            expectedUpdatedAt: second.updatedAt,
            data: { ...input, code: '088', color: second.color },
          },
          'สมชาย',
        ),
      'DUPLICATE_CODE',
    );
  });

  it('ถ้าไม่มีอะไรเปลี่ยน จะไม่เขียนซ้ำและไม่เพิ่ม AuditLog', () => {
    const { create, update, audit } = setup();
    const created = create.execute(input, 'สมชาย');
    const result = update.execute(
      {
        id: created.id,
        expectedUpdatedAt: created.updatedAt,
        data: { ...input, color: created.color },
      },
      'สมหญิง',
    );
    expect(result.updatedAt).toBe(created.updatedAt);
    expect(audit.entries).toHaveLength(1);
  });
});

describe('DeleteTechnician', () => {
  it('ลบแล้วไม่อยู่ในรายการ และบันทึก AuditLog', () => {
    const { create, remove, list, audit } = setup();
    const created = create.execute(input, 'สมชาย');
    remove.execute(created.id, 'สมหญิง');
    expect(list.execute()).toHaveLength(0);
    expect(audit.entries.at(-1)?.action).toBe('DELETE');
  });

  it('หลังลบแล้วใช้รหัสเดิมสร้างช่างใหม่ได้', () => {
    const { create, remove } = setup();
    const created = create.execute(input, 'สมชาย');
    remove.execute(created.id, 'สมชาย');
    expect(() => create.execute(input, 'สมชาย')).not.toThrow();
  });

  it('แจ้ง NOT_FOUND เมื่อลบช่างที่ไม่มีอยู่', () => {
    const { remove } = setup();
    expectDomainError(() => remove.execute('ไม่มี', 'สมชาย'), 'NOT_FOUND');
  });
});