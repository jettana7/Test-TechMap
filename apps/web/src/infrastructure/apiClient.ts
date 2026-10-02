import type {
  ApiAction,
  ApiError,
  ApiResponse,
  LoginResult,
  TechnicianInput,
  TechnicianSnapshot,
  TechnicianWriteResult,
  VersionResult,
} from '@technician-map/shared';

const API_URL = import.meta.env.VITE_API_URL ?? '';

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
  list: (token: string) => post<TechnicianSnapshot>('technician.list', undefined, token),
  create: (token: string, data: Partial<TechnicianInput>) =>
    post<TechnicianWriteResult>('technician.create', data, token),
  update: (token: string, id: string, expectedUpdatedAt: string, data: TechnicianInput) =>
    post<TechnicianWriteResult>('technician.update', { id, expectedUpdatedAt, data }, token),
  remove: (token: string, id: string) => post<VersionResult>('technician.delete', { id }, token),
};
