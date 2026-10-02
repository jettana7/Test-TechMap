export const LANGS = ['th', 'en', 'zh'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAMES: Readonly<Record<Lang, string>> = { th: 'ไทย', en: 'English', zh: '简体中文' };
export const HTML_LANG: Readonly<Record<Lang, string>> = { th: 'th', en: 'en', zh: 'zh-Hans' };

const th = {
  appTitle: 'แผนที่ช่างติดตั้ง',
  language: 'ภาษา',
  loginName: 'ชื่อของคุณ (ใช้บันทึกว่าใครแก้ข้อมูล)',
  loginPassword: 'รหัสผ่านทีม',
  loginSubmit: 'เข้าสู่ระบบ',
  loginBusy: 'กำลังเข้าสู่ระบบ...',
  addTech: '+ เพิ่มช่าง',
  refresh: 'รีเฟรช',
  logout: 'ออก',
  issues: 'ข้อมูลในชีตผิดปกติ {n} แถว เช่น แถว {row}: {msg}',
  conflictNote: '(ข้อมูลถูกโหลดใหม่แล้ว กรุณาตรวจและบันทึกอีกครั้ง)',
  confirmDelete: 'ลบช่าง {name} ({code}) ?',
  loading: 'กำลังโหลดข้อมูล...',
  titleProvince: 'จ.{prov}: {n} คน',
  titleAll: 'ช่างทั้งหมด {n} คน',
  searchPlaceholder: 'ค้นหาชื่อ รหัส เบอร์โทร หรือจังหวัด',
  showAll: 'แสดงช่างทุกจังหวัด',
  emptyProvince: 'ไม่มีช่างที่ประจำหรือไปได้ในจังหวัดนี้',
  emptyNotFound: 'ไม่พบช่างที่ตรงกับคำค้น',
  tagBase: 'ประจำจังหวัดนี้',
  tagService: 'ไปได้',
  phone: 'เบอร์โทร',
  base: 'ฐาน',
  service: 'ไปได้',
  updatedBy: 'แก้ล่าสุดโดย {name}',
  edit: 'แก้ไข',
  delete: 'ลบ',
  formAdd: 'เพิ่มช่างใหม่',
  formEdit: 'แก้ไขข้อมูลช่าง',
  fieldCode: 'รหัสช่าง (พิมพ์เลข 0 นำหน้าได้)',
  fieldNickname: 'ชื่อเล่น',
  fieldColor: 'สีประจำตัว',
  fieldBase: 'จังหวัดฐาน',
  fieldService: 'จังหวัดที่ไปได้',
  pickerPlaceholder: 'พิมพ์ชื่อจังหวัด...',
  cancel: 'ยกเลิก',
  save: 'บันทึก',
  saving: 'กำลังบันทึก...',
  mapLabel: 'แผนที่ประเทศไทย',
  zoomIn: 'ซูมเข้า',
  zoomOut: 'ซูมออก',
  zoomReset: 'รีเซ็ตมุมมอง',
};

export type MessageKey = keyof typeof th;

const en: Record<MessageKey, string> = {
  appTitle: 'Installer Map',
  language: 'Language',
  loginName: 'Your name (recorded as the editor)',
  loginPassword: 'Team password',
  loginSubmit: 'Sign in',
  loginBusy: 'Signing in...',
  addTech: '+ Add technician',
  refresh: 'Refresh',
  logout: 'Sign out',
  issues: '{n} row(s) in the sheet look wrong, e.g. row {row}: {msg}',
  conflictNote: '(Data was reloaded. Please review and save again.)',
  confirmDelete: 'Delete technician {name} ({code})?',
  loading: 'Loading...',
  titleProvince: '{prov}: {n} technician(s)',
  titleAll: 'All technicians: {n}',
  searchPlaceholder: 'Search name, code, phone or province',
  showAll: 'Show all provinces',
  emptyProvince: 'No technician is based in or can serve this province',
  emptyNotFound: 'No technician matches your search',
  tagBase: 'Based here',
  tagService: 'Can serve',
  phone: 'Phone',
  base: 'Base',
  service: 'Can serve',
  updatedBy: 'Last edited by {name}',
  edit: 'Edit',
  delete: 'Delete',
  formAdd: 'Add technician',
  formEdit: 'Edit technician',
  fieldCode: 'Technician code (leading zeros allowed)',
  fieldNickname: 'Nickname',
  fieldColor: 'Color',
  fieldBase: 'Base provinces',
  fieldService: 'Provinces they can serve',
  pickerPlaceholder: 'Type a province name...',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  mapLabel: 'Map of Thailand',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Reset view',
};

const zh: Record<MessageKey, string> = {
  appTitle: '安装技师地图',
  language: '语言',
  loginName: '您的姓名（用于记录修改人）',
  loginPassword: '团队密码',
  loginSubmit: '登录',
  loginBusy: '登录中...',
  addTech: '+ 添加技师',
  refresh: '刷新',
  logout: '退出',
  issues: '表格中有 {n} 行数据异常，例如第 {row} 行：{msg}',
  conflictNote: '（数据已重新加载，请检查后再次保存）',
  confirmDelete: '确定删除技师 {name}（{code}）吗？',
  loading: '加载中...',
  titleProvince: '{prov}：{n} 位技师',
  titleAll: '全部技师：{n} 位',
  searchPlaceholder: '搜索姓名、编号、电话或府名',
  showAll: '显示所有府的技师',
  emptyProvince: '没有常驻或可服务此府的技师',
  emptyNotFound: '没有符合搜索条件的技师',
  tagBase: '常驻此府',
  tagService: '可服务',
  phone: '电话',
  base: '常驻',
  service: '可服务',
  updatedBy: '最后修改人：{name}',
  edit: '编辑',
  delete: '删除',
  formAdd: '添加技师',
  formEdit: '编辑技师信息',
  fieldCode: '技师编号（可以以 0 开头）',
  fieldNickname: '昵称',
  fieldColor: '代表颜色',
  fieldBase: '常驻府',
  fieldService: '可服务的府',
  pickerPlaceholder: '输入府名...',
  cancel: '取消',
  save: '保存',
  saving: '保存中...',
  mapLabel: '泰国地图',
  zoomIn: '放大',
  zoomOut: '缩小',
  zoomReset: '重置视图',
};

export const MESSAGES: Readonly<Record<Lang, Readonly<Record<MessageKey, string>>>> = { th, en, zh };

export type Vars = Readonly<Record<string, string | number>>;

export function translate(lang: Lang, key: MessageKey, vars: Vars = {}): string {
  return MESSAGES[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** ใช้ค่าที่เคยเลือกไว้ก่อน ไม่มีก็ดูภาษาของเบราว์เซอร์ ไม่เข้าพวกเลยใช้ไทย */
export function detectLang(saved: string | null | undefined, browserLangs: readonly string[]): Lang {
  if (isLang(saved)) return saved;
  for (const tag of browserLangs) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'th';
}
