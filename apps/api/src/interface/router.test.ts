import type { ApiResponse, Technician } from '@technician-map/shared';
import { describe, expect, it } from 'vitest';
import { Login, VerifyToken } from '../application/authUseCases';
import {
  CreateTechnician,
  DeleteTechnician,
  UpdateTechnician,
} from '../application/technicianUseCases';
import {
  FakeClock,
  InMemoryAuditLog,
  InMemoryTechnicianRepository,
  SequentialIds,
} from '../testing/inMemoryAdapters';
import {
  FakeSigner,
  FixedSecrets,
  InMemoryDataVersion,
  InMemoryThrottle,
  ManualClock,
} from '../testing/inMemoryAuth';
import { handleRequest, type RouterDeps } from './router';

const PASSWORD = 'team-pass-123';

function setup() {
  const repository = new InMemoryTechnicianRepository();
  const audit = new InMemoryAuditLog();
  const useCaseDeps = { repository, clock: new FakeClock(), ids: new SequentialIds(), audit };
  const authDeps = {
    secrets: new FixedSecrets(PASSWORD),
    signer: new FakeSigner(),
    clock: new ManualClock(),
    throttle: new InMemoryThrottle(5),
  };
  const errors: string[] = [];
  let lockDepth = 0;
  let maxLockDepth = 0;

  const deps: RouterDeps = {
    login: new Login(authDeps),
    verify: new VerifyToken(authDeps),
    snapshots: { snapshot: () => ({ technicians: repository.list(), issues: [{ sheetRow: 9, message: 'ทดสอบ' }] }) },
    version: new InMemoryDataVersion(),
    create: new CreateTechnician(useCaseDeps),
    update: new UpdateTechnician(useCaseDeps),
    remove: new DeleteTechnician(useCaseDeps),
    runExclusive: (work) => {
      lockDepth += 1;
      maxLockDepth = Math.max(maxLockDepth, lockDepth);
      try {
        return work();
      } finally {
        lockDepth -= 1;
      }
    },
    logError: (message) => errors.push(message),
  };

  const call = (action: string, payload?: unknown, token?: string): ApiResponse<any> =>
    handleRequest(JSON.stringify({ action, token, payload }), deps);

  const login = (name = 'เอ็ม'): string => {
    const response = call('auth.login', { name, password: PASSWORD });
    if (!response.ok) throw new Error('login ไม่สำเร็จ');
    return response.data.token as string;
  };

  return { call, login, errors, audit, repository, deps, locks: () => maxLockDepth };
}

const input = {
  code: '088',
  nickname: 'xo',
  phone: '081-234-5678',
  baseProvinces: ['34'],
  serviceProvinces: ['35'],
};

function errorCode(response: ApiResponse<unknown>): string {
  if (response.ok) throw new Error('คาดว่าจะเป็น error แต่สำเร็จ');
  return response.error.code;
}

describe('คำขอที่ผิดรูปแบบ', () => {
  it('ไม่มี body, ไม่ใช่ JSON, action ไม่รู้จัก: BAD_REQUEST', () => {
    const { deps } = setup();
    expect(errorCode(handleRequest(undefined, deps))).toBe('BAD_REQUEST');
    expect(errorCode(handleRequest('{{{', deps))).toBe('BAD_REQUEST');
    expect(errorCode(handleRequest(JSON.stringify({ action: 'hack.me' }), deps))).toBe('BAD_REQUEST');
  });

  it('login ที่ payload ไม่ครบ: BAD_REQUEST', () => {
    const { call } = setup();
    expect(errorCode(call('auth.login', { name: 'เอ็ม' }))).toBe('BAD_REQUEST');
  });
});

describe('การยืนยันตัวตน', () => {
  it('ทุก action ยกเว้น auth.login ต้องมี token', () => {
    const { call } = setup();
    for (const action of ['version.get', 'technician.list', 'technician.create']) {
      expect(errorCode(call(action, input))).toBe('UNAUTHORIZED');
    }
    expect(errorCode(call('technician.list', undefined, 'v1:9999999999:x:forged'))).toBe('UNAUTHORIZED');
  });

  it('รหัสผ่านผิด: UNAUTHORIZED', () => {
    const { call } = setup();
    expect(errorCode(call('auth.login', { name: 'เอ็ม', password: 'nope' }))).toBe('UNAUTHORIZED');
  });

  it('ผิดครบ 5 ครั้ง: RATE_LIMITED', () => {
    const { call } = setup();
    for (let i = 0; i < 5; i += 1) call('auth.login', { name: 'เอ็ม', password: 'nope' });
    expect(errorCode(call('auth.login', { name: 'เอ็ม', password: PASSWORD }))).toBe('RATE_LIMITED');
  });
});

describe('การใช้งานครบวงจร', () => {
  it('เพิ่ม → ดู → แก้ → ลบ พร้อมเลข version ที่เพิ่มทุกครั้งที่ข้อมูลเปลี่ยน', () => {
    const { call, login, audit } = setup();
    const token = login('ก้อง');

    expect(call('version.get', undefined, token)).toEqual({ ok: true, data: { version: 0 } });

    const created = call('technician.create', input, token);
    expect(created.ok && created.data.version).toBe(1);
    const technician = (created.ok ? created.data.technician : undefined) as Technician;
    expect(technician.updatedBy).toBe('ก้อง');

    const listed = call('technician.list', undefined, token);
    expect(listed.ok && listed.data.version).toBe(1);
    expect(listed.ok && listed.data.technicians).toHaveLength(1);
    expect(listed.ok && listed.data.issues).toEqual([{ sheetRow: 9, message: 'ทดสอบ' }]);

    const updated = call(
      'technician.update',
      { id: technician.id, expectedUpdatedAt: technician.updatedAt, data: { ...input, color: technician.color, nickname: 'xo2' } },
      token,
    );
    expect(updated.ok && updated.data.version).toBe(2);
    const after = (updated.ok ? updated.data.technician : undefined) as Technician;

    const removed = call('technician.delete', { id: technician.id }, token);
    expect(removed).toEqual({ ok: true, data: { version: 3 } });
    expect(after.nickname).toBe('xo2');
    expect(audit.entries.map((e) => `${e.actor}:${e.action}`)).toEqual(['ก้อง:CREATE', 'ก้อง:UPDATE', 'ก้อง:DELETE']);
  });

  it('แก้โดยไม่เปลี่ยนค่า: ไม่เพิ่ม version', () => {
    const { call, login } = setup();
    const token = login();
    const created = call('technician.create', input, token);
    const technician = (created.ok ? created.data.technician : undefined) as Technician;
    const response = call(
      'technician.update',
      { id: technician.id, expectedUpdatedAt: technician.updatedAt, data: { ...input, color: technician.color } },
      token,
    );
    expect(response.ok && response.data.version).toBe(1);
  });

  it('แก้ชนกัน: CONFLICT และ version ไม่เพิ่ม', () => {
    const { call, login } = setup();
    const token = login();
    const created = call('technician.create', input, token);
    const technician = (created.ok ? created.data.technician : undefined) as Technician;
    const response = call(
      'technician.update',
      { id: technician.id, expectedUpdatedAt: '2000-01-01T00:00:00.000Z', data: { ...input, color: technician.color } },
      token,
    );
    expect(errorCode(response)).toBe('CONFLICT');
    expect(call('version.get', undefined, token)).toEqual({ ok: true, data: { version: 1 } });
  });

  it('รหัสช่างซ้ำ / ข้อมูลไม่ครบ / ไม่พบช่าง: คืน error ตามชนิด และ version ไม่เพิ่ม', () => {
    const { call, login } = setup();
    const token = login();
    call('technician.create', input, token);
    expect(errorCode(call('technician.create', input, token))).toBe('DUPLICATE_CODE');
    expect(errorCode(call('technician.create', { code: '' }, token))).toBe('VALIDATION');
    expect(errorCode(call('technician.delete', { id: 'nope' }, token))).toBe('NOT_FOUND');
    expect(call('version.get', undefined, token)).toEqual({ ok: true, data: { version: 1 } });
  });

  it('งานเขียนทำผ่าน runExclusive ส่วนงานอ่านไม่ต้องล็อก', () => {
    const { call, login, locks } = setup();
    const token = login();
    call('technician.list', undefined, token);
    call('version.get', undefined, token);
    expect(locks()).toBe(1); // มีแค่ตอน login
  });
});

describe('error ที่ไม่คาดคิด', () => {
  it('ตอบ INTERNAL แบบไม่รั่วรายละเอียด และเขียน log', () => {
    const { login, deps, errors } = setup();
    const token = login();
    const broken: RouterDeps = {
      ...deps,
      snapshots: {
        snapshot: () => {
          throw new Error('ไม่พบชีต Technicians ลับสุดยอด');
        },
      },
    };
    const response = handleRequest(JSON.stringify({ action: 'technician.list', token }), broken);
    expect(errorCode(response)).toBe('INTERNAL');
    expect(JSON.stringify(response)).not.toContain('ลับสุดยอด');
    expect(errors[0]).toContain('ลับสุดยอด');
  });
});
