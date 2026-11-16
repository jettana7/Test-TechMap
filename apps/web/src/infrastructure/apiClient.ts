import type {
  ApiAction,
  ApiError,
  ApiResponse,
  LoginResult,
  Technician,
  TechnicianInput,
  TechnicianSnapshot,
  TechnicianWriteResult,
  VersionResult,
} from '@technician-map/shared';
import { isUnavailableExpired } from '../domain/search';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const STATUS_FALLBACK_KEY = 'technician-map-status-fallback';

interface LocalTechExtension {
  readonly available: boolean;
  readonly unavailableReason: string;
  readonly unavailableUntil: string;
  readonly note: string;
}

function loadStatusFallback(): Record<string, LocalTechExtension> {
  try {
    const raw = localStorage.getItem(STATUS_FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalTechExtension>) : {};
  } catch {
    return {};
  }
}

function saveStatusFallback(id: string, override: LocalTechExtension): void {
  try {
    const map = loadStatusFallback();
    map[id] = override;
    localStorage.setItem(STATUS_FALLBACK_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage errors */
  }
}

function normalizeTechnician(
  raw: Technician,
  fallbackMap: Record<string, LocalTechExtension>,
): Technician {
  const hasBackendStatus = typeof (raw as { available?: unknown }).available === 'boolean';
  const local = fallbackMap[raw.id];

  let available = hasBackendStatus ? raw.available : (local?.available ?? true);
  let unavailableReason = hasBackendStatus
    ? (raw.unavailableReason ?? '')
    : (local?.unavailableReason ?? '');
  let unavailableUntil =
    typeof (raw as { unavailableUntil?: unknown }).unavailableUntil === 'string'
      ? raw.unavailableUntil
      : (local?.unavailableUntil ?? '');
  const note =
    typeof (raw as { note?: unknown }).note === 'string' && raw.note !== ''
      ? raw.note
      : (local?.note ?? '');

  if (!available && isUnavailableExpired(unavailableUntil)) {
    available = true;
    unavailableReason = '';
    unavailableUntil = '';
  }

  if (available) {
    unavailableReason = '';
    unavailableUntil = '';
  }

  return {
    ...raw,
    available,
    unavailableReason,
    unavailableUntil,
    note,
  };
}

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
  }
}

async function post<T>(action: ApiAction, payload?: unknown, token?: string): Promise<T> {
  if (API_URL === '') throw new Error('ยังไม่ได้ตั้งค่า VITE_API_URL ในไฟล์ .env');
  // text/plain กัน CORS preflight ซึ่ง Apps Script ไม่รองรับ
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, payload }),
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.ok) throw new ApiRequestError(body.error);
  return body.data;
}

export const api = {
  login: (name: string, password: string) => post<LoginResult>('auth.login', { name, password }),
  version: (token: string) => post<VersionResult>('version.get', undefined, token),
  list: async (token: string): Promise<TechnicianSnapshot> => {
    const snapshot = await post<TechnicianSnapshot>('technician.list', undefined, token);
    const fallbackMap = loadStatusFallback();
    return {
      ...snapshot,
      technicians: snapshot.technicians.map((t) => normalizeTechnician(t, fallbackMap)),
    };
  },
  create: async (token: string, data: Partial<TechnicianInput>): Promise<TechnicianWriteResult> => {
    const res = await post<TechnicianWriteResult>('technician.create', data, token);
    saveStatusFallback(res.technician.id, {
      available: true,
      unavailableReason: '',
      unavailableUntil: '',
      note: data.note ?? '',
    });
    return {
      ...res,
      technician: normalizeTechnician(res.technician, loadStatusFallback()),
    };
  },
  update: async (
    token: string,
    id: string,
    expectedUpdatedAt: string,
    data: TechnicianInput,
  ): Promise<TechnicianWriteResult> => {
    const available = data.available ?? true;
    const unavailableReason = available ? '' : (data.unavailableReason ?? '');
    const unavailableUntil = available ? '' : (data.unavailableUntil ?? '');
    const note = data.note ?? '';
    saveStatusFallback(id, { available, unavailableReason, unavailableUntil, note });
    const res = await post<TechnicianWriteResult>('technician.update', { id, expectedUpdatedAt, data }, token);
    return {
      ...res,
      technician: normalizeTechnician(res.technician, loadStatusFallback()),
    };
  },
  remove: (token: string, id: string) => post<VersionResult>('technician.delete', { id }, token),
};
