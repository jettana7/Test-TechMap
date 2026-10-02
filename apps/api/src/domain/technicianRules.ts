import type { ProvinceCode } from '@technician-map/shared';
import { DomainError } from './errors';

export interface CodeOwner {
  readonly id: string;
  readonly code: string;
}

export function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

export function assertCodeUnique(
  code: string,
  existing: readonly CodeOwner[],
  excludeId?: string,
): void {
  const target = normalizeCode(code);
  const clash = existing.find((t) => t.id !== excludeId && normalizeCode(t.code) === target);
  if (clash !== undefined) {
    throw new DomainError('DUPLICATE_CODE', `รหัสช่าง "${code.trim()}" ถูกใช้แล้ว`);
  }
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

export interface Coverage {
  readonly baseProvinces: ProvinceCode[];
  readonly serviceProvinces: ProvinceCode[];
}

export function normalizeCoverage(
  base: readonly ProvinceCode[],
  service: readonly ProvinceCode[],
): Coverage {
  const baseProvinces = unique(base);
  const baseSet = new Set<string>(baseProvinces);
  const serviceProvinces = unique(service).filter((code) => !baseSet.has(code));
  return { baseProvinces, serviceProvinces };
}