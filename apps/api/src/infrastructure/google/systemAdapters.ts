import type { Clock, IdGenerator } from '../../application/ports';

export class SystemClock implements Clock {
  nowIso(): string {
    return new Date().toISOString();
  }
}

export class UuidGenerator implements IdGenerator {
  next(): string {
    return Utilities.getUuid();
  }
}