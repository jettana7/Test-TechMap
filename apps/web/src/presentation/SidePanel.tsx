import type { Technician } from '@technician-map/shared';
import { useState } from 'react';
import { filterTechnicians } from '../domain/search';
import { PROVINCE_NAME as nameOf, has } from '../domain/provinces';

const names = (codes: readonly string[]): string => codes.map((c) => nameOf.get(c) ?? c).join(', ') || '-';

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
  const [query, setQuery] = useState('');
  const inProvince = province
    ? technicians.filter((t) => has(t.baseProvinces, province) || has(t.serviceProvinces, province))
    : [...technicians];
  const here = filterTechnicians(inProvince, query, nameOf);
  const title = province ? `จ.${nameOf.get(province)}: ${here.length} คน` : `ช่างทั้งหมด ${here.length} คน`;

  return (
    <section className="panel">
      <h2>{title}</h2>
      <input
        className="search"
        type="search"
        placeholder="ค้นหาชื่อ รหัส เบอร์โทร หรือจังหวัด"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {province && <button className="clear" onClick={onClearProvince}>แสดงช่างทุกจังหวัด</button>}
      {here.length === 0 && (
        <p className="muted">{query.trim() === '' ? 'ไม่มีช่างที่ประจำหรือไปได้ในจังหวัดนี้' : 'ไม่พบช่างที่ตรงกับคำค้น'}</p>
      )}
      <ul>
        {here.map((t) => {
          const open = focusId === t.id;
          const isBase = province !== undefined && has(t.baseProvinces, province);
          return (
            <li key={t.id} className={open ? 'open' : ''}>
              <button className="item" onClick={() => onFocus(open ? undefined : t.id)}>
                <i style={{ background: t.color }} />
                <b>{t.nickname}</b> <small>{t.code}</small>
                {province && <em>{isBase ? 'ประจำจังหวัดนี้' : 'ไปได้'}</em>}
              </button>
              {open && (
                <div className="detail">
                  <p>เบอร์โทร: {t.phone === '' ? '-' : <a href={`tel:${t.phone}`}>{t.phone}</a>}</p>
                  <p>ฐาน: {names(t.baseProvinces)}</p>
                  <p>ไปได้: {names(t.serviceProvinces)}</p>
                  <p className="muted">แก้ล่าสุดโดย {t.updatedBy}</p>
                  <div className="row">
                    <button onClick={() => onEdit(t)}>แก้ไข</button>
                    <button className="danger" onClick={() => onDelete(t)}>ลบ</button>
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
