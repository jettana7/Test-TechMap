import type { SheetIssue, Technician } from '@technician-map/shared';

export interface TechnicianRepository {
  /** ช่างที่ยังไม่ถูกลบ */
  list(): Technician[];
  findById(id: string): Technician | undefined;
  insert(technician: Technician): void;
  update(technician: Technician): void;
  softDelete(id: string, deletedAt: string, deletedBy: string): void;
}

export interface Clock {
  nowIso(): string;
}

export interface IdGenerator {
  next(): string;
}

export interface AuditEntry {
  readonly timestamp: string;
  readonly actor: string;
  readonly action: 'CREATE' | 'UPDATE' | 'DELETE';
  readonly technicianId: string;
  readonly summary: string;
}

export interface AuditLogger {
  record(entry: AuditEntry): void;
}

export interface DataVersion {
  current(): number;
  /** เพิ่มเลข version ต้องเรียกภายใน lock เพื่อไม่ให้ค่าหาย */
  bump(): number;
}

/** อ่านข้อมูลช่างพร้อมรายการข้อมูลผิดปกติในชีต (ใช้กับ technician.list) */
export interface SnapshotReader {
  snapshot(): { technicians: Technician[]; issues: readonly SheetIssue[] };
}

/** ความลับของระบบ เก็บใน Script Properties ไม่อยู่ในโค้ดหรือ Sheet */
export interface AuthSecrets {
  teamPassword(): string;
  signingKey(): string;
}

export interface Signer {
  sign(key: string, message: string): string;
}

/** จำกัดจำนวนครั้งที่กรอกรหัสผ่านผิด (นับรวมทุกคน เพราะชื่อที่กรอกตรวจสอบไม่ได้) */
export interface LoginThrottle {
  isBlocked(): boolean;
  recordFailure(): void;
  clear(): void;
}
