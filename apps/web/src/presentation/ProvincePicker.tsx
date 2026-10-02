import { useState } from 'react';
import { PROVINCE_CODE as codeOf, PROVINCE_LIST, PROVINCE_NAME as nameOf } from '../domain/provinces';

interface Props {
  readonly label: string;
  readonly value: readonly string[];
  readonly onChange: (codes: string[]) => void;
}

/** พิมพ์ชื่อจังหวัดแล้วเลือกจากรายการ จะกลายเป็นป้าย กด × เพื่อเอาออก */
export function ProvincePicker({ label, value, onChange }: Props) {
  const [text, setText] = useState('');
  const listId = `provinces-${label}`;

  const add = (input: string): void => {
    setText(input);
    const code = codeOf.get(input.trim());
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
            {nameOf.get(code)} ×
          </button>
        ))}
      </div>
      <input list={listId} value={text} placeholder="พิมพ์ชื่อจังหวัด..." onChange={(e) => add(e.target.value)} />
      <datalist id={listId}>
        {PROVINCE_LIST.filter((p) => !value.includes(p.code)).map((p) => (
          <option key={p.code} value={p.nameTh} />
        ))}
      </datalist>
    </div>
  );
}
