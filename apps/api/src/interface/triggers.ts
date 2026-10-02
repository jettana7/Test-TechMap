import { SheetRowNormalizer } from '../infrastructure/SheetRowNormalizer';
import { ScriptPropertiesDataVersion } from '../infrastructure/google/DataVersionStore';
import { SpreadsheetGateway } from '../infrastructure/google/SpreadsheetGateway';
import { SHEET_TECHNICIANS } from '../infrastructure/google/config';
import { withLock } from '../infrastructure/google/lock';
import { SystemClock, UuidGenerator } from '../infrastructure/google/systemAdapters';
import { FIRST_DATA_ROW } from '../infrastructure/sheetSchema';

/** ส่วนของ event ที่ใช้จริง (event ของ Google มีมากกว่านี้) */
interface EditEvent {
  readonly range: {
    getSheet(): { getName(): string };
    getRow(): number;
    getLastRow(): number;
  };
  readonly user?: { getEmail(): string };
}

interface ChangeEvent {
  readonly changeType: string;
}

/** EDIT ถูกจัดการโดย handleEdit แล้ว ส่วน FORMAT ไม่กระทบข้อมูล */
const IGNORED_CHANGE_TYPES: ReadonlySet<string> = new Set(['EDIT', 'FORMAT']);

function actorOf(event: EditEvent): string {
  const email = event.user?.getEmail() ?? '';
  return email === '' ? 'Sheet' : email;
}

export function handleEdit(event: EditEvent): void {
  if (event.range.getSheet().getName() !== SHEET_TECHNICIANS) return;

  const lastRow = event.range.getLastRow();
  if (lastRow < FIRST_DATA_ROW) return; // แก้เฉพาะหัวตาราง
  const firstRow = Math.max(event.range.getRow(), FIRST_DATA_ROW);
  const actor = actorOf(event);

  withLock(() => {
    const normalizer = new SheetRowNormalizer(
      new SpreadsheetGateway(),
      new SystemClock(),
      new UuidGenerator(),
    );
    normalizer.touch(firstRow, lastRow, actor);
    normalizer.fillMissing(actor);
    new ScriptPropertiesDataVersion().bump();
  });
}

export function handleChange(event: ChangeEvent): void {
  if (IGNORED_CHANGE_TYPES.has(event.changeType)) return;
  withLock(() => {
    new ScriptPropertiesDataVersion().bump();
  });
}