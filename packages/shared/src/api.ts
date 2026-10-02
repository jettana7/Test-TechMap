import { z } from 'zod';
import type { Technician } from './technician';

export const API_ACTIONS = [
  'auth.login',
  'version.get',
  'technician.list',
  'technician.create',
  'technician.update',
  'technician.delete',
] as const;

export type ApiAction = (typeof API_ACTIONS)[number];

export const API_ERROR_CODES = [
  'VALIDATION',
  'DUPLICATE_CODE',
  'NOT_FOUND',
  'CONFLICT',
  'FORBIDDEN',
  'UNAUTHORIZED',
  'RATE_LIMITED',
  'BUSY',
  'BAD_REQUEST',
  'INTERNAL',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** ซองคำขอที่หน้าเว็บส่งมา: { action, token, payload } */
export const requestEnvelopeSchema = z.object({
  action: z.enum(API_ACTIONS),
  token: z.string().optional(),
  payload: z.unknown().optional(),
});

export const loginPayloadSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export const updatePayloadSchema = z.object({
  id: z.string().min(1),
  expectedUpdatedAt: z.string().min(1),
  data: z.unknown(),
});

export const deletePayloadSchema = z.object({
  id: z.string().min(1),
});

export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
}

export type ApiResponse<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ApiError };

export interface SheetIssue {
  readonly sheetRow: number;
  readonly message: string;
}

export interface LoginResult {
  readonly token: string;
  readonly name: string;
  readonly expiresAt: string;
}

export interface VersionResult {
  readonly version: number;
}

export interface TechnicianSnapshot extends VersionResult {
  readonly technicians: Technician[];
  readonly issues: SheetIssue[];
}

export interface TechnicianWriteResult extends VersionResult {
  readonly technician: Technician;
}
