import {
  deletePayloadSchema,
  loginPayloadSchema,
  requestEnvelopeSchema,
  updatePayloadSchema,
  type ApiResponse,
  type ApiAction,
} from '@technician-map/shared';
import type { Login, VerifyToken } from '../application/authUseCases';
import type { DataVersion, SnapshotReader } from '../application/ports';
import type {
  CreateTechnician,
  DeleteTechnician,
  UpdateTechnician,
} from '../application/technicianUseCases';
import { DomainError } from '../domain/errors';

export interface RouterDeps {
  readonly login: Login;
  readonly verify: VerifyToken;
  readonly snapshots: SnapshotReader;
  readonly version: DataVersion;
  readonly create: CreateTechnician;
  readonly update: UpdateTechnician;
  readonly remove: DeleteTechnician;
  /** งานที่เขียนข้อมูลต้องทำทีละคำขอ (ของจริงใช้ LockService) */
  readonly runExclusive: <T>(work: () => T) => T;
  readonly logError: (message: string) => void;
}

function badRequest(message: string): DomainError {
  return new DomainError('BAD_REQUEST', message);
}

function parseBody(rawBody: string | undefined): unknown {
  if (rawBody === undefined || rawBody === '') throw badRequest('ไม่มีข้อมูลในคำขอ');
  try {
    return JSON.parse(rawBody);
  } catch {
    throw badRequest('ข้อมูลที่ส่งมาไม่ใช่ JSON');
  }
}

function parsePayload<T>(
  schema: {
    safeParse(
      value: unknown,
    ): { success: true; data: T } | { success: false };
  },
  payload: unknown,
): T {
  const result = schema.safeParse(payload);
  if (!result.success) throw badRequest('ข้อมูลในคำขอไม่ครบหรือไม่ถูกต้อง');
  return result.data;
}

function dispatch(action: ApiAction, token: string | undefined, payload: unknown, deps: RouterDeps) {
  if (action === 'auth.login') {
    const { name, password } = parsePayload(loginPayloadSchema, payload);
    return deps.runExclusive(() => deps.login.execute(name, password));
  }

  const actor = deps.verify.execute(token);

  switch (action) {
    case 'version.get':
      return { version: deps.version.current() };

    case 'technician.list': {
      // อ่านเลข version ก่อนข้อมูลเสมอ ถ้ามีคนแก้คั่นกลาง หน้าเว็บจะแค่โหลดซ้ำอีกรอบ
      const version = deps.version.current();
      const { technicians, issues } = deps.snapshots.snapshot();
      return { version, technicians, issues: [...issues] };
    }

    case 'technician.create':
      return deps.runExclusive(() => {
        const technician = deps.create.execute(payload, actor);
        return { version: deps.version.bump(), technician };
      });

    case 'technician.update': {
      const command = parsePayload(updatePayloadSchema, payload);
      return deps.runExclusive(() => {
        const technician = deps.update.execute(
          { id: command.id, expectedUpdatedAt: command.expectedUpdatedAt, data: command.data },
          actor,
        );
        // ถ้าไม่มีอะไรเปลี่ยน use case จะคืนค่าเดิม จึงไม่ต้องเพิ่ม version
        const changed = technician.updatedAt !== command.expectedUpdatedAt;
        return { version: changed ? deps.version.bump() : deps.version.current(), technician };
      });
    }

    case 'technician.delete': {
      const { id } = parsePayload(deletePayloadSchema, payload);
      return deps.runExclusive(() => {
        deps.remove.execute(id, actor);
        return { version: deps.version.bump() };
      });
    }
  }
}

export function handleRequest(rawBody: string | undefined, deps: RouterDeps): ApiResponse<unknown> {
  try {
    const envelope = requestEnvelopeSchema.safeParse(parseBody(rawBody));
    if (!envelope.success) throw badRequest('คำขอไม่ถูกต้อง หรือไม่รู้จัก action นี้');
    const { action, token, payload } = envelope.data;
    return { ok: true, data: dispatch(action, token, payload, deps) };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    deps.logError(`INTERNAL: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    return { ok: false, error: { code: 'INTERNAL', message: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' } };
  }
}
