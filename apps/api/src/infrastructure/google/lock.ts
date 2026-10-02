import { DomainError } from '../../domain/errors';

export function withLock<T>(work: () => T, timeoutMs = 15000): T {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(timeoutMs);
  } catch {
    throw new DomainError('BUSY', 'ระบบกำลังบันทึกข้อมูลของผู้อื่นอยู่ กรุณาลองใหม่อีกครั้ง');
  }
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}
