import { DomainError } from './errors';

export const MAX_ACTOR_LENGTH = 50;

/** ชื่อผู้ใช้งานที่จะถูกจดใน AuditLog และ updatedBy */
export function requireActor(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '' || trimmed.length > MAX_ACTOR_LENGTH) {
    throw new DomainError('VALIDATION', `กรุณาระบุชื่อผู้ใช้งาน (ไม่เกิน ${MAX_ACTOR_LENGTH} ตัวอักษร)`);
  }
  return trimmed;
}
