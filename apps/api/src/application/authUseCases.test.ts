import { describe, expect, it } from 'vitest';
import { TOKEN_TTL_SECONDS, createToken, readToken, safeEqual } from '../domain/authToken';
import { DomainError } from '../domain/errors';
import {
  FakeSigner,
  FixedSecrets,
  InMemoryThrottle,
  ManualClock,
} from '../testing/inMemoryAuth';
import { Login, VerifyToken } from './authUseCases';

function setup() {
  const secrets = new FixedSecrets('team-pass-123');
  const clock = new ManualClock();
  const throttle = new InMemoryThrottle(3);
  const deps = { secrets, signer: new FakeSigner(), clock, throttle };
  return { secrets, clock, throttle, login: new Login(deps), verify: new VerifyToken(deps) };
}

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    return (error as DomainError).code;
  }
  throw new Error('คาดว่าจะเกิด DomainError แต่ไม่เกิด');
}

describe('safeEqual', () => {
  it('เทียบข้อความได้ถูกต้อง', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', '')).toBe(true);
  });
});

describe('token', () => {
  const sign = (key: string, message: string) => new FakeSigner().sign(key, message);

  it('อ่านชื่อภาษาไทยกลับมาได้ครบ', () => {
    const token = createToken('สมชาย ใจดี', 2000, 'k', sign);
    expect(readToken(token, 1000, 'k', sign)).toBe('สมชาย ใจดี');
  });

  it('ปฏิเสธ token ที่ถูกแก้ชื่อ กุญแจผิด หมดอายุ หรือรูปแบบผิด', () => {
    const token = createToken('ก้อง', 2000, 'k', sign);
    const forged = token.replace(encodeURIComponent('ก้อง'), encodeURIComponent('แอดมิน'));
    expect(readToken(forged, 1000, 'k', sign)).toBeUndefined();
    expect(readToken(token, 1000, 'other-key', sign)).toBeUndefined();
    expect(readToken(token, 2000, 'k', sign)).toBeUndefined();
    expect(readToken('garbage', 1000, 'k', sign)).toBeUndefined();
    expect(readToken('x'.repeat(600), 1000, 'k', sign)).toBeUndefined();
  });
});

describe('Login', () => {
  it('รหัสถูก: ได้ token ที่ VerifyToken อ่านชื่อกลับมาได้ และหมดอายุตามกำหนด', () => {
    const { login, verify, clock } = setup();
    const result = login.execute('  เอ็ม ', 'team-pass-123');
    expect(result.name).toBe('เอ็ม');
    expect(Date.parse(result.expiresAt) - Date.parse(clock.nowIso())).toBe(TOKEN_TTL_SECONDS * 1000);
    expect(verify.execute(result.token)).toBe('เอ็ม');

    clock.advanceSeconds(TOKEN_TTL_SECONDS + 1);
    expect(codeOf(() => verify.execute(result.token))).toBe('UNAUTHORIZED');
  });

  it('รหัสผิด: UNAUTHORIZED และนับครั้งที่ผิด', () => {
    const { login, throttle } = setup();
    expect(codeOf(() => login.execute('เอ็ม', 'wrong'))).toBe('UNAUTHORIZED');
    expect(throttle.failures).toBe(1);
  });

  it('ผิดครบจำนวนที่กำหนด: ถูกบล็อก แม้ใส่รหัสถูกก็เข้าไม่ได้จนกว่าจะหมดเวลา', () => {
    const { login } = setup();
    for (let i = 0; i < 3; i += 1) codeOf(() => login.execute('เอ็ม', 'wrong'));
    expect(codeOf(() => login.execute('เอ็ม', 'team-pass-123'))).toBe('RATE_LIMITED');
  });

  it('เข้าสำเร็จแล้วล้างตัวนับที่ผิด', () => {
    const { login, throttle } = setup();
    codeOf(() => login.execute('เอ็ม', 'wrong'));
    login.execute('เอ็ม', 'team-pass-123');
    expect(throttle.failures).toBe(0);
  });

  it('ไม่ใส่ชื่อ หรือชื่อยาวเกิน: VALIDATION', () => {
    const { login } = setup();
    expect(codeOf(() => login.execute('   ', 'team-pass-123'))).toBe('VALIDATION');
    expect(codeOf(() => login.execute('ก'.repeat(51), 'team-pass-123'))).toBe('VALIDATION');
  });

  it('ยังไม่ได้ตั้งรหัสผ่านทีม: โยน error ธรรมดา (ไม่ใช่ DomainError) และไม่นับเป็นรหัสผิด', () => {
    const { login, secrets, throttle } = setup();
    secrets.setPassword('');
    expect(() => login.execute('เอ็ม', '')).toThrow('TEAM_PASSWORD');
    expect(throttle.failures).toBe(0);
  });
});

describe('VerifyToken', () => {
  it('ไม่มี token หรือ token ว่าง: UNAUTHORIZED', () => {
    const { verify } = setup();
    expect(codeOf(() => verify.execute(undefined))).toBe('UNAUTHORIZED');
    expect(codeOf(() => verify.execute(''))).toBe('UNAUTHORIZED');
  });

  it('เปลี่ยนรหัสผ่านทีมแล้ว token เดิมใช้ไม่ได้ทันที', () => {
    const { login, verify, secrets } = setup();
    const { token } = login.execute('เอ็ม', 'team-pass-123');
    secrets.setPassword('new-password-456');
    expect(codeOf(() => verify.execute(token))).toBe('UNAUTHORIZED');
  });
});
