import type { Technician } from '@technician-map/shared';
import { useState, type CSSProperties } from 'react';
import { useI18n } from '../application/I18nContext';
import { provinceSearchNames } from '../domain/provinceNames';
import { PROVINCE_LIST, has } from '../domain/provinces';
import {
  addDaysIsoDate,
  filterByStatus,
  filterTechnicians,
  sortTechnicians,
  todayIsoDate,
  type StatusFilter,
} from '../domain/search';

interface Props {
  readonly technicians: readonly Technician[];
  readonly statusFilter: StatusFilter;
  readonly onStatusFilterChange: (status: StatusFilter) => void;
  readonly province: string | undefined;
  readonly onSelectProvince: (code: string | undefined) => void;
  readonly focusId: string | undefined;
  readonly busy: boolean;
  readonly error: string;
  readonly onFocus: (id: string | undefined) => void;
  readonly onEdit: (t: Technician) => void;
  readonly onDelete: (t: Technician) => void;
  readonly onUpdateStatus: (
    t: Technician,
    available: boolean,
    unavailableReason: string,
    unavailableUntil: string,
  ) => Promise<boolean>;
}

export function SidePanel({
  technicians,
  statusFilter,
  onStatusFilterChange,
  province,
  onSelectProvince,
  focusId,
  busy,
  error,
  onFocus,
  onEdit,
  onDelete,
  onUpdateStatus,
}: Props) {
  const { t, label } = useI18n();
  const [query, setQuery] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<string>();
  const [reasonDraft, setReasonDraft] = useState('');
  const [untilDraft, setUntilDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string>();

  const inProvince = province
    ? technicians.filter((tech) => has(tech.baseProvinces, province) || has(tech.serviceProvinces, province))
    : [...technicians];

  const availableCount = inProvince.filter((tech) => tech.available !== false).length;
  const unavailableCount = inProvince.length - availableCount;

  const byStatus = filterByStatus(inProvince, statusFilter);
  const searched = filterTechnicians(byStatus, query, provinceSearchNames);
  const here = sortTechnicians(searched, province);

  const title = province
    ? t('titleProvince', { prov: label(province), n: here.length })
    : t('titleAll', { n: here.length });

  const presets = [t('presetJob'), t('presetLeave'), t('presetRepair')];

  const openReasonEditor = (tech: Technician): void => {
    setEditingStatusId(tech.id);
    setReasonDraft(tech.unavailableReason ?? '');
    setUntilDraft(tech.unavailableUntil ?? '');
  };

  const submitUnavailable = async (tech: Technician): Promise<void> => {
    const ok = await onUpdateStatus(tech, false, reasonDraft.trim(), untilDraft.trim());
    if (ok) setEditingStatusId(undefined);
  };

  const markAvailable = async (tech: Technician): Promise<void> => {
    const ok = await onUpdateStatus(tech, true, '', '');
    if (ok) setEditingStatusId(undefined);
  };

  const copyTechnicianInfo = async (tech: Technician): Promise<void> => {
    const isAvailable = tech.available !== false;
    const statusText = isAvailable
      ? t('statusAvailable')
      : `${t('statusUnavailable')}${tech.unavailableReason ? ` (${tech.unavailableReason})` : ''}`;
    const baseNames = tech.baseProvinces.map(label).join(', ') || '-';
    const serviceNames = tech.serviceProvinces.map(label).join(', ');
    const lines = [
      `👷 ${tech.nickname} (${tech.code}) — ${statusText}`,
      `📞 ${t('phone')}: ${tech.phone || '-'}`,
      `📍 ${t('base')}: ${baseNames}`,
      ...(serviceNames ? [`🚗 ${t('service')}: ${serviceNames}`] : []),
      ...(tech.note ? [`📝 ${tech.note}`] : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedId(tech.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === tech.id ? undefined : current));
      }, 2000);
    } catch {
      /* ignore clipboard permission issues */
    }
  };

  const renderProvinceList = (codes: readonly string[]) => {
    if (codes.length === 0) return <span className="muted">-</span>;
    return (
      <span className="prov-tags">
        {codes.map((code) => (
          <span
            key={code}
            className={`prov-tag ${province === code ? 'highlight' : ''}`}
          >
            {label(code)}
          </span>
        ))}
      </span>
    );
  };

  return (
    <section className="panel">
      <div className="panel-top">
        <div className="panel-heading">
          <h2>{title}</h2>
          {province && (
            <button type="button" className="province-pill" onClick={() => onSelectProvince(undefined)}>
              <span>📍 {label(province)}</span>
              <span aria-hidden="true">×</span>
              <small>{t('showAll')}</small>
            </button>
          )}
        </div>

        <div className="filter-tabs" role="tablist" aria-label={t('fieldStatus')}>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'available'}
            className={`filter-tab ${statusFilter === 'available' ? 'active ok' : ''}`}
            onClick={() => onStatusFilterChange('available')}
          >
            <span className="tab-top">
              <span className="status-dot ok" aria-hidden="true" />
              <span>{t('filterAvailable')}</span>
            </span>
            <strong className="tab-count">{availableCount}</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'unavailable'}
            className={`filter-tab ${statusFilter === 'unavailable' ? 'active busy' : ''}`}
            onClick={() => onStatusFilterChange('unavailable')}
          >
            <span className="tab-top">
              <span className="status-dot busy" aria-hidden="true" />
              <span>{t('filterUnavailable')}</span>
            </span>
            <strong className="tab-count">{unavailableCount}</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('all')}
          >
            <span className="tab-top">
              <span>{t('filterAll')}</span>
            </span>
            <strong className="tab-count">{inProvince.length}</strong>
          </button>
        </div>

        <div className="filter-controls">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"
              />
            </svg>
            <input
              className="search"
              type="search"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query !== '' && (
              <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label={t('cancel')}>
                ×
              </button>
            )}
          </div>

          <select
            className="province-select"
            aria-label={t('mapJumpProvince')}
            value={province ?? ''}
            onChange={(e) => onSelectProvince(e.target.value === '' ? undefined : e.target.value)}
          >
            <option value="">📍 {t('mapAllProvinces')}</option>
            {PROVINCE_LIST.map((p) => (
              <option key={p.code} value={p.code}>
                {label(p.code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error !== '' && <p className="error-box">{error}</p>}

      {technicians.length === 0 && <p className="empty">{t('emptyAll')}</p>}
      {technicians.length > 0 && here.length === 0 && (
        <p className="empty">{query.trim() === '' ? t('emptyProvince') : t('emptyNotFound')}</p>
      )}

      <ul className="tech-list">
        {here.map((tech) => {
          const isFocused = focusId === tech.id;
          const isAvailable = tech.available !== false;
          const isBase = province !== undefined && has(tech.baseProvinces, province);
          const isEditingReason = editingStatusId === tech.id;
          const isCopied = copiedId === tech.id;

          return (
            <li
              key={tech.id}
              className={`tech-card ${isFocused ? 'open' : ''} ${isAvailable ? '' : 'is-busy'}`}
              style={{ '--c': tech.color } as CSSProperties}
            >
              <div className="card-body">
                <div className="card-header-row">
                  <div className="who-group">
                    <span className="color-dot" style={{ background: tech.color }} aria-hidden="true" />
                    <b className="tech-name">{tech.nickname}</b>
                    <span className="code-badge">{tech.code}</span>
                    {province && (
                      <em className={isBase ? 'tag-base' : 'tag-service'}>
                        {isBase ? `⭐ ${t('tagBase')}` : `🚗 ${t('tagService')}`}
                      </em>
                    )}
                  </div>

                  <span className={`status-badge ${isAvailable ? 'ok' : 'busy'}`}>
                    <span className={`status-dot ${isAvailable ? 'ok' : 'busy'}`} aria-hidden="true" />
                    {isAvailable ? t('statusAvailable') : t('statusUnavailable')}
                  </span>
                </div>

                {!isAvailable && (
                  <div className="reason-banner">
                    <span>
                      {(tech.unavailableReason ?? '') !== ''
                        ? t('reasonLabel', { reason: tech.unavailableReason })
                        : t('reasonUnspecified')}
                    </span>
                    {(tech.unavailableUntil ?? '') !== '' && (
                      <span className="until-pill">
                        📅 {t('untilBanner', { date: tech.unavailableUntil })}
                      </span>
                    )}
                  </div>
                )}

                <div className="coverage-info">
                  <div className="coverage-line">
                    <span className="coverage-label">📍 {t('base')}:</span>
                    {renderProvinceList(tech.baseProvinces)}
                  </div>
                  {tech.serviceProvinces.length > 0 && (
                    <div className="coverage-line">
                      <span className="coverage-label">🚗 {t('service')}:</span>
                      {renderProvinceList(tech.serviceProvinces)}
                    </div>
                  )}
                  {(tech.note ?? '') !== '' && (
                    <div className="note-line">
                      <span>📝 {t('noteDisplay', { note: tech.note })}</span>
                    </div>
                  )}
                </div>

                <div className="meta-row">
                  <div className="contact-actions">
                    {tech.phone !== '' ? (
                      <a className="call-pill" href={`tel:${tech.phone}`}>
                        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"
                          />
                        </svg>
                        <span>{t('callTech', { phone: tech.phone })}</span>
                      </a>
                    ) : (
                      <span className="muted updated-meta">{t('phone')}: -</span>
                    )}
                    <button
                      type="button"
                      className={`copy-pill ${isCopied ? 'copied' : ''}`}
                      onClick={() => void copyTechnicianInfo(tech)}
                    >
                      {isCopied ? `✓ ${t('copiedInfo')}` : `📋 ${t('copyInfo')}`}
                    </button>
                  </div>
                  <span className="muted updated-meta">{t('updatedBy', { name: tech.updatedBy })}</span>
                </div>

                {isEditingReason ? (
                  <div className="quick-reason-editor">
                    <label className="field">
                      <span>{t('fieldReason')}</span>
                      <input
                        value={reasonDraft}
                        placeholder={t('reasonPlaceholder')}
                        maxLength={200}
                        autoFocus
                        onChange={(e) => setReasonDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void submitUnavailable(tech);
                          }
                        }}
                      />
                    </label>
                    <div className="preset-chips">
                      {presets.map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          className="preset-chip"
                          onClick={() => setReasonDraft(preset)}
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
                        value={untilDraft}
                        onChange={(e) => setUntilDraft(e.target.value)}
                      />
                    </label>
                    <div className="preset-chips">
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setUntilDraft(addDaysIsoDate(1))}
                      >
                        {t('untilTomorrow')}
                      </button>
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setUntilDraft(addDaysIsoDate(3))}
                      >
                        {t('until3Days')}
                      </button>
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setUntilDraft(addDaysIsoDate(7))}
                      >
                        {t('untilNextWeek')}
                      </button>
                      {untilDraft !== '' && (
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setUntilDraft('')}
                        >
                          × {t('untilClear')}
                        </button>
                      )}
                    </div>

                    <div className="row">
                      <button
                        type="button"
                        className="ghost-sm"
                        disabled={busy}
                        onClick={() => setEditingStatusId(undefined)}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        className="primary-sm"
                        disabled={busy}
                        onClick={() => void submitUnavailable(tech)}
                      >
                        {busy ? t('saving') : t('quickSaveBusy')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card-action-bar">
                    {isAvailable ? (
                      <button
                        type="button"
                        className="action-btn mark-busy"
                        disabled={busy}
                        onClick={() => openReasonEditor(tech)}
                      >
                        <span className="status-dot busy" aria-hidden="true" />
                        {t('quickMarkBusy')}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="action-btn mark-ready"
                          disabled={busy}
                          onClick={() => void markAvailable(tech)}
                        >
                          <span className="status-dot ok" aria-hidden="true" />
                          {t('quickMarkReady')}
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          disabled={busy}
                          onClick={() => openReasonEditor(tech)}
                        >
                          {t('quickEditReason')}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className={`action-btn ${isFocused ? 'active-map' : ''}`}
                      onClick={() => onFocus(isFocused ? undefined : tech.id)}
                    >
                      🗺️ {isFocused ? t('viewingOnMapBtn') : t('viewMapBtn')}
                    </button>

                    <button type="button" className="action-btn" onClick={() => onEdit(tech)}>
                      ✏️ {t('edit')}
                    </button>

                    <button type="button" className="action-btn danger" onClick={() => onDelete(tech)}>
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
