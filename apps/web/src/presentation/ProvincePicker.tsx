import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../application/I18nContext';
import { provinceFromText, provinceSearchNames } from '../domain/provinceNames';
import { PROVINCE_LIST } from '../domain/provinces';

interface Props {
  readonly label: string;
  readonly value: readonly string[];
  readonly onChange: (codes: string[]) => void;
}

/**
 * ช่องเลือกจังหวัดแบบพิมพ์ค้นหาพร้อม Dropdown ตัวเลือกที่เปิดเฉพาะตอนคลิกหรือพิมพ์ ไม่รกตา
 */
export function ProvincePicker({ label, value, onChange }: Props) {
  const { t, label: nameOf } = useI18n();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, []);

  const addCode = (code: string): void => {
    if (!value.includes(code)) onChange([...value, code]);
    setText('');
    setOpen(false);
  };

  const handleInput = (input: string): void => {
    setText(input);
    setOpen(true);
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
    <div className="province-picker" ref={wrapRef}>
      <div className="picker-head">
        <span className="picker-label">{label}</span>
        {value.length > 0 && (
          <div className="picker-head-right">
            <span className="picker-meta">{t('pickerSelectedCount', { n: value.length })}</span>
            <button type="button" className="clear-all-btn" onClick={() => onChange([])}>
              {t('clearAllProvinces')}
            </button>
          </div>
        )}
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

      <div className="dropdown-box">
        <div className="dropdown-input-wrap">
          <input
            value={text}
            placeholder={t('pickerPlaceholder')}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              } else if (e.key === 'Enter' && filteredProvinces.length > 0) {
                e.preventDefault();
                const first = filteredProvinces[0];
                if (first) addCode(first.code);
              }
            }}
          />
          <button
            type="button"
            className="dropdown-toggle-btn"
            tabIndex={-1}
            aria-label={label}
            onClick={() => setOpen((prev) => !prev)}
          >
            ▾
          </button>
        </div>

        {open && filteredProvinces.length > 0 && (
          <ul className="dropdown-menu" role="listbox" aria-label={label}>
            {filteredProvinces.map((p) => (
              <li key={p.code}>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => addCode(p.code)}
                >
                  {nameOf(p.code)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
