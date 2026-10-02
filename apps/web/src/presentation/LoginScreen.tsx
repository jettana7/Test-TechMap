import { useState, type FormEvent } from 'react';
import { api } from '../infrastructure/apiClient';
import type { Session } from '../infrastructure/session';

export function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
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
        <h1>แผนที่ช่างติดตั้ง</h1>
        <label>
          ชื่อของคุณ (ใช้บันทึกว่าใครแก้ข้อมูล)
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
        </label>
        <label>
          รหัสผ่านทีม
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error !== '' && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
      </form>
    </main>
  );
}
