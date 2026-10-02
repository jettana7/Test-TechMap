import type { Technician, TechnicianInput } from '@technician-map/shared';
import { useCallback, useState } from 'react';
import { useTechnicians } from './application/useTechnicians';
import { ApiRequestError, api } from './infrastructure/apiClient';
import { clearSession, loadSession, saveSession, type Session } from './infrastructure/session';
import { LoginScreen } from './presentation/LoginScreen';
import { SidePanel } from './presentation/SidePanel';
import { TechnicianForm } from './presentation/TechnicianForm';
import { ThailandMap } from './presentation/ThailandMap';

type Editing = { readonly technician?: Technician } | undefined;

function Workspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { technicians, issues, loading, error, reload } = useTechnicians(session.token, onLogout);
  const [province, setProvince] = useState<string>();
  const [focusId, setFocusId] = useState<string>();
  const [editing, setEditing] = useState<Editing>();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const focus = technicians.find((t) => t.id === focusId);

  const run = async (work: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setFormError('');
    try {
      await work();
      await reload();
      return true;
    } catch (e) {
      if (e instanceof ApiRequestError && e.error.code === 'UNAUTHORIZED') onLogout();
      else if (e instanceof ApiRequestError && e.error.code === 'CONFLICT') {
        setFormError(`${e.error.message} (ข้อมูลถูกโหลดใหม่แล้ว กรุณาตรวจและบันทึกอีกครั้ง)`);
        await reload();
      } else setFormError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (data: Partial<TechnicianInput>): Promise<void> => {
    const target = editing?.technician;
    const ok = await run(() =>
      target
        ? api.update(session.token, target.id, target.updatedAt, { ...target, ...data } as TechnicianInput)
        : api.create(session.token, data),
    );
    if (ok) setEditing(undefined);
  };

  const remove = async (t: Technician): Promise<void> => {
    if (!window.confirm(`ลบช่าง ${t.nickname} (${t.code}) ?`)) return;
    if (await run(() => api.remove(session.token, t.id))) setFocusId(undefined);
  };

  const select = useCallback((code: string) => setProvince((p) => (p === code ? undefined : code)), []);

  return (
    <div className="app">
      <header>
        <b>แผนที่ช่างติดตั้ง</b>
        <span className="muted">{session.name}</span>
        <button className="primary" onClick={() => { setFormError(''); setEditing({}); }}>+ เพิ่มช่าง</button>
        <button onClick={() => void reload()}>รีเฟรช</button>
        <button onClick={onLogout}>ออก</button>
      </header>
      {error !== '' && <p className="banner error">{error}</p>}
      {issues.length > 0 && (
        <p className="banner">ข้อมูลในชีตผิดปกติ {issues.length} แถว เช่น แถว {issues[0]?.sheetRow}: {issues[0]?.message}</p>
      )}
      <main>
        <ThailandMap technicians={technicians} selected={province} focus={focus} onSelect={select} />
        {loading ? (
          <p className="panel muted">กำลังโหลดข้อมูล...</p>
        ) : editing ? (
          <section className="panel">
            <TechnicianForm
              key={editing.technician?.id ?? 'new'}
              {...(editing.technician ? { technician: editing.technician } : {})}
              busy={busy}
              error={formError}
              onSubmit={(d) => void save(d)}
              onCancel={() => setEditing(undefined)}
            />
          </section>
        ) : (
          <SidePanel
            technicians={technicians}
            province={province}
            focusId={focusId}
            onFocus={setFocusId}
            onEdit={(t) => { setFormError(''); setEditing({ technician: t }); }}
            onDelete={(t) => void remove(t)}
          />
        )}
      </main>
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<Session | undefined>(loadSession);
  const logout = useCallback(() => { clearSession(); setSession(undefined); }, []);
  if (!session) {
    return <LoginScreen onLogin={(s) => { saveSession(s); setSession(s); }} />;
  }
  return <Workspace session={session} onLogout={logout} />;
}
