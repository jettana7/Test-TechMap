// ทดสอบ API ที่ deploy แล้วจริงๆ ด้วยลำดับ: login -> เพิ่ม -> ดู -> แก้ -> แก้ชนกัน -> ลบ
// ใช้: ตั้งค่า API_URL กับ TEAM_PASSWORD แล้วรัน  node scripts/smoke-test.mjs
// (ข้อมูลทดสอบรหัส ZZ-SMOKE จะถูกลบแบบ soft delete ท้ายสคริปต์ และยังเห็นในชีตเป็นแถวที่มีเวลา "ลบเมื่อ")

const url = process.env.API_URL;
const password = process.env.TEAM_PASSWORD;
const name = process.env.TEST_NAME ?? 'smoke-test';

if (!url || !password) {
  console.error('ต้องตั้งค่า API_URL และ TEAM_PASSWORD ก่อน (ดูวิธีตั้งในคู่มือ)');
  process.exit(1);
}

let failed = false;
function check(label, condition, detail = '') {
  console.log(`${condition ? '✓' : '✗'} ${label}${condition ? '' : ` ${detail}`}`);
  if (!condition) failed = true;
}

async function call(action, payload, token) {
  const response = await fetch(url, {
    method: 'POST',
    // text/plain กัน CORS preflight ซึ่ง Apps Script ไม่รองรับ
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, payload }),
    redirect: 'follow',
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`ตอบกลับไม่ใช่ JSON (HTTP ${response.status}): ${text.slice(0, 300)}`);
  }
}

const errorCode = (response) => (response.ok ? 'ไม่มี error' : response.error.code);

const wrong = await call('auth.login', { name, password: `${password}-wrong` });
check('รหัสผ่านผิดถูกปฏิเสธ (UNAUTHORIZED)', errorCode(wrong) === 'UNAUTHORIZED', errorCode(wrong));

const login = await call('auth.login', { name, password });
check('login สำเร็จ', login.ok, JSON.stringify(login));
if (!login.ok) process.exit(1);
const token = login.data.token;

const noToken = await call('technician.list');
check('เรียกโดยไม่มี token ถูกปฏิเสธ', errorCode(noToken) === 'UNAUTHORIZED', errorCode(noToken));

const before = await call('version.get', undefined, token);
check('อ่าน version ได้', before.ok, JSON.stringify(before));
if (!before.ok) process.exit(1);

const created = await call(
  'technician.create',
  { code: 'ZZ-SMOKE', nickname: 'ทดสอบ', phone: '', baseProvinces: ['10'], serviceProvinces: ['11'] },
  token,
);
check('เพิ่มช่างทดสอบ', created.ok, JSON.stringify(created));
if (!created.ok) process.exit(1);
const technician = created.data.technician;
check('เลข version เพิ่มขึ้นหลังเพิ่ม', created.data.version > before.data.version);
check(`ผู้แก้ถูกจดเป็น "${name}"`, technician.updatedBy === name, technician.updatedBy);

const listed = await call('technician.list', undefined, token);
check(
  'list เห็นช่างทดสอบ',
  listed.ok && listed.data.technicians.some((t) => t.id === technician.id),
);

const data = {
  code: technician.code,
  nickname: 'ทดสอบ2',
  phone: technician.phone,
  color: technician.color,
  baseProvinces: technician.baseProvinces,
  serviceProvinces: technician.serviceProvinces,
};
const updated = await call(
  'technician.update',
  { id: technician.id, expectedUpdatedAt: technician.updatedAt, data },
  token,
);
check('แก้ไขช่างทดสอบ', updated.ok && updated.data.technician.nickname === 'ทดสอบ2', JSON.stringify(updated));

const conflict = await call(
  'technician.update',
  { id: technician.id, expectedUpdatedAt: technician.updatedAt, data: { ...data, nickname: 'ชนกัน' } },
  token,
);
check('แก้ด้วยข้อมูลเก่าถูกปฏิเสธ (CONFLICT)', errorCode(conflict) === 'CONFLICT', errorCode(conflict));

const removed = await call('technician.delete', { id: technician.id }, token);
check('ลบช่างทดสอบ', removed.ok, JSON.stringify(removed));

const finalList = await call('technician.list', undefined, token);
check(
  'list ไม่เห็นช่างทดสอบแล้ว',
  finalList.ok && !finalList.data.technicians.some((t) => t.id === technician.id),
);

console.log(failed ? '\nมีบางขั้นไม่ผ่าน' : '\nผ่านครบทุกขั้น');
process.exit(failed ? 1 : 0);
