import type { Technician, TechnicianInput } from '@technician-map/shared';
import { useCallback, useState } from 'react';
import { useI18n } from './application/I18nContext';
import { useTechnicians } from './application/useTechnicians';
import { filterByStatus, type StatusFilter } from './domain/search';
import { ApiRequestError, api } from './infrastructure/apiClient';
import { clearSession, loadSession, saveSession, type Session } from './infrastructure/session';
import { LanguageSwitch } from './presentation/LanguageSwitch';
import { LoginScreen } from './presentation/LoginScreen';
import { SidePanel } from './presentation/SidePanel';
import { TechnicianForm } from './presentation/TechnicianForm';
import { ThailandMap } from './presentation/ThailandMap';

type Editing = { readonly technician?: Technician } | undefined;
type MobileTab = 'list' | 'map';

function Workspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { t } = useI18n();
  const { technicians, issues, loading, error, reload } = useTechnicians(session.token, onLogout);
  const [province, setProvince] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('available');
  const [focusId, setFocusId] = useState<string>();
  const [editing, setEditing] = useState<Editing>();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');

  const mapTechnicians = filterByStatus(technicians, statusFilter);
  const focus = technicians.find((tech) => tech.id === focusId);

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
        setFormError(`${e.error.message} ${t('conflictNote')}`);
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

  const updateStatus = async (
    tech: Technician,
    available: boolean,
    unavailableReason: string,
    unavailableUntil: string,
  ): Promise<boolean> => {
    const payload: TechnicianInput = {
      code: tech.code,
      nickname: tech.nickname,
      phone: tech.phone,
      color: tech.color,
      baseProvinces: tech.baseProvinces,
      serviceProvinces: tech.serviceProvinces,
      available,
      unavailableReason: available ? '' : unavailableReason,
      unavailableUntil: available ? '' : unavailableUntil,
      note: tech.note ?? '',
    };
    return run(() => api.update(session.token, tech.id, tech.updatedAt, payload));
  };

  const remove = async (tech: Technician): Promise<void> => {
    if (!window.confirm(t('confirmDelete', { name: tech.nickname, code: tech.code }))) return;
    if (await run(() => api.remove(session.token, tech.id))) setFocusId(undefined);
  };

  const select = useCallback((code: string) => {
    setProvince((p) => (p === code ? undefined : code));
  }, []);

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">🗺️</span>
          <b>{t('appTitle')}</b>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="primary add-btn"
            onClick={() => {
              setFormError('');
              setEditing({});
              setMobileTab('list');
            }}
          >
            {t('addTech')}
          </button>
          <button type="button" className="ghost" onClick={() => void reload()}>
            ↻ {t('refresh')}
          </button>
          <LanguageSwitch />
          <span className="user">{session.name}</span>
          <button type="button" className="ghost" onClick={onLogout}>
            {t('logout')}
          </button>
        </div>
      </header>

      {error !== '' && <p className="banner error">{error}</p>}
      {issues.length > 0 && (
        <p className="banner">
          {t('issues', { n: issues.length, row: issues[0]?.sheetRow ?? '', msg: issues[0]?.message ?? '' })}
        </p>
      )}

      <div className="mobile-view-switch">
        <button
          type="button"
          className={mobileTab === 'list' ? 'active' : ''}
          onClick={() => setMobileTab('list')}
        >
          👷 {t('tabList', { n: mapTechnicians.length })}
        </button>
        <button
          type="button"
          className={mobileTab === 'map' ? 'active' : ''}
          onClick={() => setMobileTab('map')}
        >
          🗺️ {t('tabMap')}
        </button>
      </div>

      <main className={`view-${mobileTab}`}>
        <ThailandMap
          technicians={mapTechnicians}
          selected={province}
          focus={focus}
          onSelect={(code) => {
            select(code);
          }}
          onClearProvince={() => setProvince(undefined)}
          onClearFocus={() => setFocusId(undefined)}
        />
        {loading ? (
          <p className="panel muted">{t('loading')}</p>
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
            statusFilter={statusFilter}
            onStatusFilterChange={(next) => {
              setFormError('');
              setStatusFilter(next);
            }}
            province={province}
            onSelectProvince={setProvince}
            focusId={focusId}
            busy={busy}
            error={formError}
            onFocus={(id) => {
              setFormError('');
              setFocusId(id);
              if (id !== undefined) setMobileTab('map');
            }}
            onEdit={(tech) => {
              setFormError('');
              setEditing({ technician: tech });
            }}
            onDelete={(tech) => void remove(tech)}
            onUpdateStatus={updateStatus}
          />
        )}
      </main>
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<Session | undefined>(loadSession);
  const logout = useCallback(() => {
    clearSession();
    setSession(undefined);
  }, []);
  if (!session) {
    return (
      <LoginScreen
        onLogin={(s) => {
          saveSession(s);
          setSession(s);
        }}
      />
    );
  }
  return <Workspace session={session} onLogout={logout} />;
}
