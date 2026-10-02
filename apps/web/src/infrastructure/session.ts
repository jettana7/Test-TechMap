const KEY = 'technician-map-session';

export interface Session {
  readonly token: string;
  readonly name: string;
  readonly expiresAt: string;
}

export function loadSession(): Session | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return undefined;
    const session = JSON.parse(raw) as Session;
    return Date.parse(session.expiresAt) > Date.now() ? session : undefined;
  } catch {
    return undefined;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* โหมดส่วนตัวอาจเขียนไม่ได้ ใช้งานต่อได้แค่ต้อง login ใหม่ตอนรีเฟรช */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ไม่ต้องทำอะไร */
  }
}
