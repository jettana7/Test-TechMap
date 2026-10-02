import type {
  AuthSecrets,
  Clock,
  DataVersion,
  LoginThrottle,
  Signer,
} from '../application/ports';

/** ลายเซ็นจำลองสำหรับทดสอบตรรกะ (ของจริงใช้ HMAC-SHA256 ใน AppsScriptSigner) */
export class FakeSigner implements Signer {
  sign(key: string, message: string): string {
    let hash = 5381;
    for (const char of `${key}|${message}`) {
      hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
    }
    return `sig${(hash >>> 0).toString(36)}`;
  }
}

export class FixedSecrets implements AuthSecrets {
  constructor(
    private password: string,
    private readonly key = 'test-signing-key',
  ) {}

  setPassword(password: string): void {
    this.password = password;
  }

  teamPassword(): string {
    return this.password;
  }

  signingKey(): string {
    return this.key;
  }
}

export class InMemoryThrottle implements LoginThrottle {
  constructor(private readonly max = 5) {}

  public failures = 0;

  isBlocked(): boolean {
    return this.failures >= this.max;
  }

  recordFailure(): void {
    this.failures += 1;
  }

  clear(): void {
    this.failures = 0;
  }
}

/** นาฬิกาที่เดินเมื่อสั่งเท่านั้น ใช้ทดสอบ token หมดอายุ */
export class ManualClock implements Clock {
  private ms = Date.parse('2026-01-01T00:00:00.000Z');

  advanceSeconds(seconds: number): void {
    this.ms += seconds * 1000;
  }

  nowIso(): string {
    return new Date(this.ms).toISOString();
  }
}

export class InMemoryDataVersion implements DataVersion {
  private value = 0;

  current(): number {
    return this.value;
  }

  bump(): number {
    this.value += 1;
    return this.value;
  }
}
