import type { LoginResult } from '@technician-map/shared';
import { requireActor } from '../domain/actor';
import { TOKEN_TTL_SECONDS, createToken, readToken, safeEqual } from '../domain/authToken';
import { DomainError } from '../domain/errors';
import type { AuthSecrets, Clock, LoginThrottle, Signer } from './ports';

export interface AuthDeps {
  readonly secrets: AuthSecrets;
  readonly signer: Signer;
  readonly clock: Clock;
  readonly throttle: LoginThrottle;
}

function nowSeconds(clock: Clock): number {
  return Math.floor(Date.parse(clock.nowIso()) / 1000);
}

/**
 * กุญแจเซ็น token ผูกกับรหัสผ่านปัจจุบันด้วย
 * จึงเมื่อเปลี่ยนรหัสผ่านทีม token เดิมทุกอันใช้ไม่ได้ทันที
 */
function tokenKey(deps: AuthDeps): string {
  return deps.signer.sign(deps.secrets.signingKey(), `token-key:${deps.secrets.teamPassword()}`);
}

export class Login {
  constructor(private readonly deps: AuthDeps) {}

  /** ต้องเรียกภายใน lock เพื่อให้การนับครั้งที่ผิดไม่หาย */
  execute(rawName: string, password: string): LoginResult {
    const name = requireActor(rawName);
    const { secrets, signer, clock, throttle } = this.deps;

    if (throttle.isBlocked()) {
      throw new DomainError('RATE_LIMITED', 'กรอกรหัสผ่านผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่');
    }

    const expected = secrets.teamPassword();
    if (expected === '') {
      throw new Error('ยังไม่ได้ตั้ง TEAM_PASSWORD ใน Script Properties');
    }

    // เทียบ "ลายเซ็นของรหัสผ่าน" แทนตัวรหัสผ่านเอง ความยาวเท่ากันเสมอ ไม่รั่วจากเวลาตอบ
    const key = secrets.signingKey();
    const matches = safeEqual(signer.sign(key, `pw:${password}`), signer.sign(key, `pw:${expected}`));
    if (!matches) {
      throttle.recordFailure();
      throw new DomainError('UNAUTHORIZED', 'รหัสผ่านไม่ถูกต้อง');
    }

    throttle.clear();
    const expiresAtSec = nowSeconds(clock) + TOKEN_TTL_SECONDS;
    return {
      token: createToken(name, expiresAtSec, tokenKey(this.deps), (k, m) => signer.sign(k, m)),
      name,
      expiresAt: new Date(expiresAtSec * 1000).toISOString(),
    };
  }
}

export class VerifyToken {
  constructor(private readonly deps: AuthDeps) {}

  /** คืนชื่อผู้ใช้จาก token ถ้าใช้ไม่ได้จะโยน UNAUTHORIZED */
  execute(token: string | undefined): string {
    const { signer, clock } = this.deps;
    const name =
      token === undefined || token === ''
        ? undefined
        : readToken(token, nowSeconds(clock), tokenKey(this.deps), (k, m) => signer.sign(k, m));
    if (name === undefined) {
      throw new DomainError('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบใหม่');
    }
    return name;
  }
}
