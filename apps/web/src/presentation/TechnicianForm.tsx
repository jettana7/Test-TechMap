import { isProvinceCode, type Technician, type TechnicianInput } from '@technician-map/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../application/I18nContext';
import { addDaysIsoDate, todayIsoDate } from '../domain/search';
import { ProvincePicker } from './ProvincePicker';

interface Props {
  /** ไม่ส่งมา = เพิ่มช่างใหม่ */
  readonly technician?: Technician;
  readonly busy: boolean;
  readonly error: string;
  readonly onSubmit: (data: Partial<TechnicianInput>) => void;
  readonly onCancel: () => void;
}

const onlyProvinces = (codes: string[]) => codes.filter(isProvinceCode);

export function TechnicianForm({ technician, busy, error, onSubmit, onCancel }: Props) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState(technician?.code ?? '');
  const [nickname, setNickname] = useState(technician?.nickname ?? '');
  const [phone, setPhone] = useState(technician?.phone ?? '');
  const [color, setColor] = useState(technician?.color);
  const [note, setNote] = useState(technician?.note ?? '');
  const [base, setBase] = useState<string[]>([...(technician?.baseProvinces ?? [])]);
  const [service, setService] = useState<string[]>([...(technician?.serviceProvinces ?? [])]);
  const [available, setAvailable] = useState<boolean>(technician ? technician.available !== false : true);
  const [unavailableReason, setUnavailableReason] = useState<string>(technician?.unavailableReason ?? '');
  const [unavailableUntil, setUnavailableUntil] = useState<string>(technician?.unavailableUntil ?? '');

  useEffect(() => {
    formRef.current?.closest('.panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const presets = [t('presetJob'), t('presetLeave'), t('presetRepair')];

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const isAvailable = technician ? available : true;
    onSubmit({
      code,
      nickname,
      phone,
      ...(color === undefined ? {} : { color }),
      note: note.trim(),
      baseProvinces: onlyProvinces(base),
      serviceProvinces: onlyProvinces(service),
      available: isAvailable,
      unavailableReason: isAvailable ? '' : unavailableReason.trim(),
      unavailableUntil: isAvailable ? '' : unavailableUntil.trim(),
    });
  };

  return (
    <form ref={formRef} className="form" onSubmit={submit}>
      <div className="form-topbar">
        <button type="button" className="back-btn" onClick={onCancel} disabled={busy}>
          {t('backToList')}
        </button>
        <h2>{technician ? t('formEdit') : t('formAdd')}</h2>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? t('saving') : t('save')}
        </button>
      </div>

      {error !== '' && <p className="error-box">{error}</p>}

      {!technician && (
        <div className="info-note">
          <span className="status-dot ok" aria-hidden="true" />
          <span>{t('newTechReadyNote')}</span>
        </div>
      )}

      {technician && (
        <div className="form-section">
          <span className="section-title">{t('fieldStatus')}</span>
          <div className="status-toggle" role="group" aria-label={t('fieldStatus')}>
            <button
              type="button"
              className={`status-option ${available ? 'active-ok' : ''}`}
              onClick={() => setAvailable(true)}
            >
              <span className="status-dot ok" aria-hidden="true" />
              {t('statusAvailable')}
            </button>
            <button
              type="button"
              className={`status-option ${!available ? 'active-busy' : ''}`}
              onClick={() => setAvailable(false)}
            >
              <span className="status-dot busy" aria-hidden="true" />
              {t('statusUnavailable')}
            </button>
          </div>

          {!available && (
            <div className="reason-box">
              <label className="field">
                <span>{t('fieldReason')}</span>
                <input
                  value={unavailableReason}
                  placeholder={t('reasonPlaceholder')}
                  maxLength={200}
                  onChange={(e) => setUnavailableReason(e.target.value)}
                />
              </label>
              <div className="preset-chips">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    className="preset-chip"
                    onClick={() => setUnavailableReason(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <label className="field">
                <span>📅 {t('fieldUntil')}</span>
                <input
                  type="date"
                  min={todayIsoDate()}
                  value={unavailableUntil}
                  onChange={(e) => setUnavailableUntil(e.target.value)}
                />
              </label>
              <div className="preset-chips">
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setUnavailableUntil(addDaysIsoDate(1))}
                >
                  {t('untilTomorrow')}
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setUnavailableUntil(addDaysIsoDate(3))}
                >
                  {t('until3Days')}
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setUnavailableUntil(addDaysIsoDate(7))}
                >
                  {t('untilNextWeek')}
                </button>
                {unavailableUntil !== '' && (
                  <button
                    type="button"
                    className="preset-chip"
                    onClick={() => setUnavailableUntil('')}
                  >
                    × {t('untilClear')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-section">
        <span className="section-title">{t('sectionBasic')}</span>
        <div className="field-grid">
          <label className="field">
            <span>{t('fieldCode')}</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} required />
          </label>
          <label className="field">
            <span>{t('fieldNickname')}</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={50} required />
          </label>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>{t('phone')}</span>
            <input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </label>
          {technician && (
            <label className="field">
              <span>{t('fieldColor')}</span>
              <input type="color" value={color ?? '#888888'} onChange={(e) => setColor(e.target.value)} />
            </label>
          )}
        </div>
        <label className="field">
          <span>📝 {t('fieldNote')}</span>
          <input
            value={note}
            placeholder={t('notePlaceholder')}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="form-section">
        <span className="section-title">{t('sectionCoverage')}</span>
        <ProvincePicker label={t('fieldBase')} value={base} onChange={setBase} />
        <ProvincePicker label={t('fieldService')} value={service} onChange={setService} />
      </div>

      <div className="row form-actions">
        <button type="button" onClick={onCancel} disabled={busy}>{t('cancel')}</button>
        <button type="submit" className="primary" disabled={busy}>{busy ? t('saving') : t('save')}</button>
      </div>
    </form>
  );
}
