import { useState, type FormEvent } from 'react';
import { useI18n } from '../application/I18nContext';
import { api } from '../infrastructure/apiClient';
import type { Session } from '../infrastructure/session';
import { LanguageSwitch } from './LanguageSwitch';

export function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(await api.login(name, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <form onSubmit={(e) => void submit(e)}>
        <h1>{t('appTitle')}</h1>
        <LanguageSwitch />
        <label>
          {t('loginName')}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
        </label>
        <label>
          {t('loginPassword')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error !== '' && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? t('loginBusy') : t('loginSubmit')}</button>
      </form>
    </main>
  );
}
