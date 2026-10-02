import { technicianInputSchema, type Technician } from '@technician-map/shared';
import { pickColor } from '../domain/colorPalette';
import { requireActor } from '../domain/actor';
import { DomainError } from '../domain/errors';
import { changedFieldLabels } from '../domain/technicianChanges';
import { assertCodeUnique, normalizeCoverage } from '../domain/technicianRules';
import type { AuditLogger, Clock, IdGenerator, TechnicianRepository } from './ports';

export interface UseCaseDeps {
  readonly repository: TechnicianRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly audit: AuditLogger;
}

export interface UpdateTechnicianCommand {
  readonly id: string;
  /** updatedAt ที่หน้าเว็บเห็นตอนเปิดฟอร์ม ใช้ตรวจว่ามีคนแก้ตัดหน้าไหม */
  readonly expectedUpdatedAt: string;
  readonly data: unknown;
}

const createSchema = technicianInputSchema.partial({ color: true });

function validationError(issues: readonly { message: string }[]): DomainError {
  return new DomainError('VALIDATION', issues.map((issue) => issue.message).join(', '));
}

function label(t: { code: string; nickname: string }): string {
  return `${t.code} ${t.nickname}`;
}

export class ListTechnicians {
  constructor(private readonly deps: UseCaseDeps) {}

  execute(): Technician[] {
    return this.deps.repository.list();
  }
}

export class CreateTechnician {
  constructor(private readonly deps: UseCaseDeps) {}

  execute(raw: unknown, actorName: string): Technician {
    const actor = requireActor(actorName);
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) throw validationError(parsed.error.issues);
    const data = parsed.data;

    const { repository, clock, ids, audit } = this.deps;
    const existing = repository.list();
    assertCodeUnique(data.code, existing);

    const color = (data.color ?? pickColor(existing.map((t) => t.color))).toUpperCase();
    const coverage = normalizeCoverage(data.baseProvinces, data.serviceProvinces);
    const now = clock.nowIso();

    const technician: Technician = {
      id: ids.next(),
      code: data.code,
      nickname: data.nickname,
      phone: data.phone,
      color,
      baseProvinces: coverage.baseProvinces,
      serviceProvinces: coverage.serviceProvinces,
      updatedAt: now,
      updatedBy: actor,
    };

    repository.insert(technician);
    audit.record({
      timestamp: now,
      actor,
      action: 'CREATE',
      technicianId: technician.id,
      summary: `เพิ่มช่าง ${label(technician)}`,
    });
    return technician;
  }
}

export class UpdateTechnician {
  constructor(private readonly deps: UseCaseDeps) {}

  execute(command: UpdateTechnicianCommand, actorName: string): Technician {
    const actor = requireActor(actorName);
    const parsed = technicianInputSchema.safeParse(command.data);
    if (!parsed.success) throw validationError(parsed.error.issues);
    const data = parsed.data;

    const { repository, clock, audit } = this.deps;
    const current = repository.findById(command.id);
    if (current === undefined) {
      throw new DomainError('NOT_FOUND', 'ไม่พบช่างคนนี้ อาจถูกลบไปแล้ว');
    }
    if (current.updatedAt !== command.expectedUpdatedAt) {
      throw new DomainError('CONFLICT', 'ข้อมูลช่างคนนี้ถูกแก้ไขโดยผู้อื่นแล้ว กรุณาโหลดข้อมูลใหม่');
    }
    assertCodeUnique(data.code, repository.list(), command.id);

    const coverage = normalizeCoverage(data.baseProvinces, data.serviceProvinces);
    const candidate = {
      code: data.code,
      nickname: data.nickname,
      phone: data.phone,
      color: data.color.toUpperCase(),
      baseProvinces: coverage.baseProvinces,
      serviceProvinces: coverage.serviceProvinces,
    };

    const changed = changedFieldLabels(current, candidate);
    if (changed.length === 0) return current;

    const now = clock.nowIso();
    const updated: Technician = { ...current, ...candidate, updatedAt: now, updatedBy: actor };

    repository.update(updated);
    audit.record({
      timestamp: now,
      actor,
      action: 'UPDATE',
      technicianId: updated.id,
      summary: `แก้ไขช่าง ${label(updated)}: ${changed.join(', ')}`,
    });
    return updated;
  }
}

export class DeleteTechnician {
  constructor(private readonly deps: UseCaseDeps) {}

  execute(id: string, actorName: string): void {
    const actor = requireActor(actorName);
    const { repository, clock, audit } = this.deps;

    const current = repository.findById(id);
    if (current === undefined) {
      throw new DomainError('NOT_FOUND', 'ไม่พบช่างคนนี้ อาจถูกลบไปแล้ว');
    }

    const now = clock.nowIso();
    repository.softDelete(id, now, actor);
    audit.record({
      timestamp: now,
      actor,
      action: 'DELETE',
      technicianId: id,
      summary: `ลบช่าง ${label(current)}`,
    });
  }
}
