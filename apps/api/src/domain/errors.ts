import type { ApiErrorCode } from '@technician-map/shared';

/** error ที่ตั้งใจโยนเอง (INTERNAL เป็นของที่ router สร้างเมื่อเจอ error ที่ไม่คาดคิด) */
export type DomainErrorCode = Exclude<ApiErrorCode, 'INTERNAL'>;

export class DomainError extends Error {
  public readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
