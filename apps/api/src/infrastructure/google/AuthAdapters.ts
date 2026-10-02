import type { AuthSecrets, LoginThrottle, Signer } from '../../application/ports';
import { PROP_SIGNING_KEY, PROP_TEAM_PASSWORD } from './config';

function readProperty(name: string): string {
  return PropertiesService.getScriptProperties().getProperty(name) ?? '';
}

export class ScriptPropertiesAuthSecrets implements AuthSecrets {
  teamPassword(): string {
    return readProperty(PROP_TEAM_PASSWORD);
  }

  signingKey(): string {
    const key = readProperty(PROP_SIGNING_KEY);
    if (key === '') throw new Error('ยังไม่ได้สร้างกุญแจเซ็น token กรุณารันฟังก์ชัน setupAuth ก่อน');
    return key;
  }
}

export class AppsScriptSigner implements Signer {
  sign(key: string, message: string): string {
    return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(message, key));
  }
}

const THROTTLE_KEY = 'login_failures';
const MAX_FAILURES = 5;
const BLOCK_SECONDS = 15 * 60;

/** ใช้ CacheService เก็บตัวนับ หมดอายุเอง 15 นาทีหลังกรอกผิดครั้งล่าสุด */
export class CacheLoginThrottle implements LoginThrottle {
  private failures(): number {
    const raw = CacheService.getScriptCache().get(THROTTLE_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  isBlocked(): boolean {
    return this.failures() >= MAX_FAILURES;
  }

  recordFailure(): void {
    CacheService.getScriptCache().put(THROTTLE_KEY, String(this.failures() + 1), BLOCK_SECONDS);
  }

  clear(): void {
    CacheService.getScriptCache().remove(THROTTLE_KEY);
  }
}
