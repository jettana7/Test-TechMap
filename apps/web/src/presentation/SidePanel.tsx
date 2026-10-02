import type { Technician } from '@technician-map/shared';
import { useState } from 'react';
import { filterTechnicians } from '../domain/search';
import { useI18n } from '../application/I18nContext';
import { has } from '../domain/provinces';
import { provinceSearchNames } from '../domain/provinceNames';


interface Props {
  readonly technicians: readonly Technician[];
  readonly province: string | undefined;
  readonly focusId: string | undefined;
  readonly onClearProvince: () => void;
  readonly onFocus: (id: string | undefined) => void;
  readonly onEdit: (t: Technician) => void;
  readonly onDelete: (t: Technician) => void;
}

export function SidePanel({ technicians, province, focusId, onClearProvince, onFocus, onEdit, onDelete }: Props) {
  const { t, label } = useI18n();
  const names = (codes: readonly string[]): string => codes.map(label).join(', ') || '-';
  const [query, setQuery] = useState('');
  const inProvince = province
    ? technicians.filter((t) => has(t.baseProvinces, province) || has(t.serviceProvinces, province))
    : [...technicians];
  const here = filterTechnicians(inProvince, query, provinceSearchNames);
  const title = province ? t('titleProvince', { prov: label(province), n: here.length }) : t('titleAll', { n: here.length });

  return (
    <section className="panel">
      <h2>{title}</h2>
      <input
        className="search"
        type="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {province && <button className="clear" onClick={onClearProvince}>{t('showAll')}</button>}
      {here.length === 0 && (
        <p className="muted">{query.trim() === '' ? t('emptyProvince') : t('emptyNotFound')}</p>
      )}
      <ul>
        {here.map((tech) => {
          const open = focusId === tech.id;
          const isBase = province !== undefined && has(tech.baseProvinces, province);
          return (
            <li key={tech.id} className={open ? 'open' : ''}>
              <button className="item" onClick={() => onFocus(open ? undefined : tech.id)}>
                <i style={{ background: tech.color }} />
                <b>{tech.nickname}</b> <small>{tech.code}</small>
                {province && <em>{isBase ? t('tagBase') : t('tagService')}</em>}
              </button>
              {open && (
                <div className="detail">
                  <p>{t('phone')}: {tech.phone === '' ? '-' : <a href={`tel:${tech.phone}`}>{tech.phone}</a>}</p>
                  <p>{t('base')}: {names(tech.baseProvinces)}</p>
                  <p>{t('service')}: {names(tech.serviceProvinces)}</p>
                  <p className="muted">{t('updatedBy', { name: tech.updatedBy })}</p>
                  <div className="row">
                    <button onClick={() => onEdit(tech)}>{t('edit')}</button>
                    <button className="danger" onClick={() => onDelete(tech)}>{t('delete')}</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
