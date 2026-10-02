import { PROP_SIGNING_KEY, PROP_TEAM_PASSWORD } from '../infrastructure/google/config';

const MIN_PASSWORD_LENGTH = 8;

/** รันจาก Apps Script editor: สร้างกุญแจเซ็น token (ถ้ายังไม่มี) และตรวจว่าตั้งรหัสผ่านทีมแล้ว รันซ้ำได้ปลอดภัย */
export function setupAuth(): void {
  const properties = PropertiesService.getScriptProperties();

  if ((properties.getProperty(PROP_SIGNING_KEY) ?? '') === '') {
    properties.setProperty(PROP_SIGNING_KEY, `${Utilities.getUuid()}${Utilities.getUuid()}`);
    Logger.log('สร้างกุญแจเซ็น token แล้ว');
  } else {
    Logger.log('มีกุญแจเซ็น token อยู่แล้ว');
  }

  const password = properties.getProperty(PROP_TEAM_PASSWORD) ?? '';
  if (password === '') {
    Logger.log(
      `ยังไม่ได้ตั้งรหัสผ่านทีม: ไปที่ Project Settings (รูปเฟือง) > Script Properties > เพิ่ม property ชื่อ ${PROP_TEAM_PASSWORD}`,
    );
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    Logger.log(`รหัสผ่านทีมสั้นเกินไป (ตอนนี้ ${password.length} ตัว) ควรยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
  } else {
    Logger.log(`รหัสผ่านทีม: ตั้งแล้ว (ยาว ${password.length} ตัวอักษร)`);
  }
}
