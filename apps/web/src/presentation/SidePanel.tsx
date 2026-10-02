import type { Technician } from '@technician-map/shared';
import { PROVINCE_NAME as nameOf, has } from '../domain/provinces';

const names = (codes: readonly string[]): string => codes.map((c) => nameOf.get(c) ?? c).join(', ') || '-';

interface Props {
  readonly technicians: readonly Technician[];
  readonly province: string | undefined;
  readonly focusId: string | undefined;
  readonly onFocus: (id: string | undefined) => void;
  readonly onEdit: (t: Technician) => void;
  readonly onDelete: (t: Technician) => void;
}

export function SidePanel({ technicians, province, focusId, onFocus, onEdit, onDelete }: Props) {
  const here = province
    ? technicians.filter((t) => has(t.baseProvinces, province) || has(t.serviceProvinces, province))
    : technicians;
  const title = province ? `จ.${nameOf.get(province)}: ${here.length} คน` : `ช่างทั้งหมด ${here.length} คน`;

  return (
    <section className="panel">
      <h2>{title}</h2>
      {here.length === 0 && <p className="muted">ไม่มีช่างที่ประจำหรือไปได้ในจังหวัดนี้</p>}
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
