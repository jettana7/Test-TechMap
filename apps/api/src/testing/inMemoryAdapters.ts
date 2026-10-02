import type { Technician } from '@technician-map/shared';
import type {
  AuditEntry,
  AuditLogger,
  Clock,
  IdGenerator,
  TechnicianRepository,
} from '../application/ports';

export class InMemoryTechnicianRepository implements TechnicianRepository {
  private items: Technician[] = [];
  public readonly deleted: Technician[] = [];

  list(): Technician[] {
    return this.items.map((t) => ({ ...t }));
  }

  findById(id: string): Technician | undefined {
    const found = this.items.find((t) => t.id === id);
    return found === undefined ? undefined : { ...found };
  }

  insert(technician: Technician): void {
    this.items.push({ ...technician });
  }

  update(technician: Technician): void {
    const index = this.items.findIndex((t) => t.id === technician.id);
    if (index === -1) throw new Error(`update: ไม่พบ id ${technician.id}`);
    this.items[index] = { ...technician };
  }

  softDelete(id: string): void {
    const index = this.items.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`softDelete: ไม่พบ id ${id}`);
    const [removed] = this.items.splice(index, 1);
    if (removed !== undefined) this.deleted.push(removed);
  }
}

/** เวลาเดินหน้า 1 วินาทีทุกครั้งที่ถูกเรียก ทำให้ผลทดสอบคงที่ */
export class FakeClock implements Clock {
  private ms = Date.parse('2026-01-01T00:00:00.000Z');

  nowIso(): string {
    const iso = new Date(this.ms).toISOString();
    this.ms += 1000;
    return iso;
  }
}

export class SequentialIds implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}

export class InMemoryAuditLog implements AuditLogger {
  public readonly entries: AuditEntry[] = [];

  record(entry: AuditEntry): void {
    this.entries.push(entry);
  }
}