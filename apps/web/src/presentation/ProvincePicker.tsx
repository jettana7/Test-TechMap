import { useState } from 'react';
import { useI18n } from '../application/I18nContext';
import { provinceFromText, provinceSearchNames } from '../domain/provinceNames';
import { PROVINCE_LIST, REGION_GROUPS } from '../domain/provinces';

interface Props {
  readonly label: string;
  readonly value: readonly string[];
  readonly onChange: (codes: string[]) => void;
}

/**
 * ตัวเลือกจังหวัดที่รองรับการแตะเลือกโซน/รายจังหวัดบน iPad และการพิมพ์ค้นหาได้ทุกภาษา
 */
export function ProvincePicker({ label, value, onChange }: Props) {
  const { t, label: nameOf } = useI18n();
  const [text, setText] = useState('');

  const addCode = (code: string): void => {
    if (!value.includes(code)) onChange([...value, code]);
    setText('');
  };

  const addManyCodes = (codes: readonly string[]): void => {
    const merged = [...new Set([...value, ...codes])];
    onChange(merged);
  };

  const handleInput = (input: string): void => {
    setText(input);
    const exactCode = provinceFromText(input);
    if (exactCode !== undefined) {
      addCode(exactCode);
    }
  };

  const q = text.trim().toLowerCase();
  const availableProvinces = PROVINCE_LIST.filter((p) => !value.includes(p.code));
  const filteredProvinces =
    q === ''
      ? availableProvinces
      : availableProvinces.filter((p) =>
          provinceSearchNames(p.code).some((name) => name.toLowerCase().includes(q)),
        );

  return (
    <div className="province-picker">
      <div className="picker-head">
        <span className="picker-label">{label}</span>
        <div className="picker-head-right">
          <span className="picker-meta">
            {value.length > 0 ? t('pickerSelectedCount', { n: value.length }) : t('pickerNoSelected')}
          </span>
          {value.length > 0 && (
            <button type="button" className="clear-all-btn" onClick={() => onChange([])}>
              {t('clearAllProvinces')}
            </button>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="chips">
          {value.map((code) => (
            <button
              type="button"
              key={code}
              className="chip"
              onClick={() => onChange(value.filter((c) => c !== code))}
            >
              <span>{nameOf(code)}</span>
              <span className="chip-remove" aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="region-bar">
        <span className="region-bar-label">{t('regionQuickSelect')}</span>
        <div className="region-buttons">
          {REGION_GROUPS.map((group) => {
            const allSelected = group.codes.every((code) => value.includes(code));
            return (
              <button
                type="button"
                key={group.key}
                className={`region-pill ${allSelected ? 'done' : ''}`}
                disabled={allSelected}
                onClick={() => addManyCodes(group.codes)}
              >
                {t(group.key)}
              </button>
            );
          })}
        </div>
      </div>

      <input
        value={text}
        placeholder={t('pickerPlaceholder')}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filteredProvinces.length > 0) {
            e.preventDefault();
            const first = filteredProvinces[0];
            if (first) addCode(first.code);
          }
        }}
      />

      <div className="picker-suggestions" role="group" aria-label={label}>
        {filteredProvinces.map((p) => (
          <button
            type="button"
            key={p.code}
            className="suggestion-pill"
            onClick={() => addCode(p.code)}
          >
            + {nameOf(p.code)}
          </button>
        ))}
      </div>
    </div>
  );
}
