/** ฟังก์ชันเซ็นข้อความด้วยกุญแจ (HMAC) คืนข้อความที่ปลอดภัยต่อการใส่ใน token */
export type SignFn = (key: string, message: string) => string;

export const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

const TOKEN_VERSION = 'v1';
const MAX_TOKEN_LENGTH = 500;

/** เทียบข้อความโดยใช้เวลาเท่ากันไม่ว่าจะผิดตรงไหน (กันการเดาจากเวลาตอบ) */
export function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** รูปแบบ token: v1:<หมดอายุ (วินาที)>:<ชื่อที่ encode>:<ลายเซ็น> */
export function createToken(name: string, expiresAtSec: number, key: string, sign: SignFn): string {
  const body = `${TOKEN_VERSION}:${expiresAtSec}:${encodeURIComponent(name)}`;
  return `${body}:${sign(key, body)}`;
}

/** คืนชื่อผู้ใช้ถ้า token ถูกต้องและยังไม่หมดอายุ ไม่เช่นนั้นคืน undefined */
export function readToken(
  token: string,
  nowSec: number,
  key: string,
  sign: SignFn,
): string | undefined {
  if (token.length > MAX_TOKEN_LENGTH) return undefined;
  const parts = token.split(':');
  if (parts.length !== 4) return undefined;

  const [version, expiry, encodedName, signature] = parts;
  if (
    version !== TOKEN_VERSION ||
    expiry === undefined ||
    encodedName === undefined ||
    signature === undefined
  ) {
    return undefined;
  }

  const body = `${version}:${expiry}:${encodedName}`;
  if (!safeEqual(signature, sign(key, body))) return undefined;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt <= nowSec) return undefined;

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return undefined;
  }
}
