import { useState } from 'react';
import { useI18n } from '../application/I18nContext';
import { PROVINCE_LIST } from '../domain/provinces';
import { provinceFromText } from '../domain/provinceNames';

interface Props {
  readonly label: string;
  readonly value: readonly string[];
  readonly onChange: (codes: string[]) => void;
}

/** พิมพ์ชื่อจังหวัด (ภาษาไทย อังกฤษ หรือจีน) แล้วเลือกจากรายการ จะกลายเป็นป้าย กด × เพื่อเอาออก */
export function ProvincePicker({ label, value, onChange }: Props) {
  const { t, label: nameOf } = useI18n();
  const [text, setText] = useState('');
  const listId = `provinces-${label}`;

  const add = (input: string): void => {
    setText(input);
    const code = provinceFromText(input);
    if (code !== undefined) {
      if (!value.includes(code)) onChange([...value, code]);
      setText('');
    }
  };

  return (
    <div className="field">
      <span>{label}</span>
      <div className="chips">
        {value.map((code) => (
          <button type="button" key={code} className="chip" onClick={() => onChange(value.filter((c) => c !== code))}>
            {nameOf(code)} ×
          </button>
        ))}
      </div>
      <input list={listId} value={text} placeholder={t('pickerPlaceholder')} onChange={(e) => add(e.target.value)} />
      <datalist id={listId}>
        {PROVINCE_LIST.filter((p) => !value.includes(p.code)).map((p) => (
          <option key={p.code} value={nameOf(p.code)} />
        ))}
      </datalist>
    </div>
  );
}
