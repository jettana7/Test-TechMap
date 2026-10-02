import type { SheetIssue, Technician } from '@technician-map/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, api } from '../infrastructure/apiClient';

const POLL_MS = 15_000;

export interface TechnicianStore {
  readonly technicians: Technician[];
  readonly issues: SheetIssue[];
  readonly loading: boolean;
  readonly error: string;
  readonly reload: () => Promise<void>;
}

/** โหลดรายชื่อช่าง และตรวจเลข version ทุก 15 วินาที (หยุดเมื่อซ่อนแท็บ โหลดทันทีเมื่อกลับมา) */
export function useTechnicians(token: string, onUnauthorized: () => void): TechnicianStore {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(-1);

  const handle = useCallback(
    (e: unknown) => {
      if (e instanceof ApiRequestError && e.error.code === 'UNAUTHORIZED') onUnauthorized();
      else setError(e instanceof Error ? e.message : String(e));
    },
    [onUnauthorized],
  );

  const reload = useCallback(async () => {
    try {
      const snapshot = await api.list(token);
      version.current = snapshot.version;
      setTechnicians(snapshot.technicians);
      setIssues(snapshot.issues);
      setError('');
    } catch (e) {
      handle(e);
    } finally {
      setLoading(false);
    }
  }, [token, handle]);

  useEffect(() => {
    void reload();
    const check = async (): Promise<void> => {
      if (document.hidden) return;
      try {
        const { version: latest } = await api.version(token);
        if (latest !== version.current) await reload();
      } catch (e) {
        handle(e);
      }
    };
    const timer = window.setInterval(() => void check(), POLL_MS);
    const onVisible = (): void => void check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, reload, handle]);

  return { technicians, issues, loading, error, reload };
}
