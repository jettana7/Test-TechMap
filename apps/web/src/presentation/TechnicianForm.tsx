import { isProvinceCode, type Technician, type TechnicianInput } from '@technician-map/shared';
import { useState, type FormEvent } from 'react';
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
  const [code, setCode] = useState(technician?.code ?? '');
  const [nickname, setNickname] = useState(technician?.nickname ?? '');
  const [phone, setPhone] = useState(technician?.phone ?? '');
  const [color, setColor] = useState(technician?.color);
  const [base, setBase] = useState<string[]>([...(technician?.baseProvinces ?? [])]);
  const [service, setService] = useState<string[]>([...(technician?.serviceProvinces ?? [])]);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onSubmit({
      code,
      nickname,
      phone,
      ...(color === undefined ? {} : { color }),
      baseProvinces: onlyProvinces(base),
      serviceProvinces: onlyProvinces(service),
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <h2>{technician ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่างใหม่'}</h2>
      <label className="field">
        <span>รหัสช่าง (พิมพ์เลข 0 นำหน้าได้)</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} required />
      </label>
      <label className="field">
        <span>ชื่อเล่น</span>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={50} required />
      </label>
      <label className="field">
        <span>เบอร์โทร</span>
        <input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} maxLength={20} />
      </label>
      {technician && (
        <label className="field">
          <span>สีประจำตัว</span>
          <input type="color" value={color ?? '#888888'} onChange={(e) => setColor(e.target.value)} />
        </label>
      )}
      <ProvincePicker label="จังหวัดฐาน" value={base} onChange={setBase} />
      <ProvincePicker label="จังหวัดที่ไปได้" value={service} onChange={setService} />
      {error !== '' && <p className="error">{error}</p>}
      <div className="row">
        <button type="button" onClick={onCancel} disabled={busy}>ยกเลิก</button>
        <button className="primary" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
      </div>
    </form>
  );
}
