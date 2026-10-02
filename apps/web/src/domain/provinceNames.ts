import type { Lang } from './i18n';
import { PROVINCE_NAME } from './provinces';

/** ชื่ออังกฤษมาจากข้อมูลแผนที่ (OpenGISData-Thailand) */
const EN: Readonly<Record<string, string>> = {
  '10': 'Bangkok',
  '11': 'Samut Prakan',
  '12': 'Nonthaburi',
  '13': 'Pathum Thani',
  '14': 'Phra Nakhon Si Ayutthaya',
  '15': 'Ang Thong',
  '16': 'Lopburi',
  '17': 'Sing Buri',
  '18': 'Chainat',
  '19': 'Saraburi',
  '20': 'Chonburi',
  '21': 'Rayong',
  '22': 'Chanthaburi',
  '23': 'Trat',
  '24': 'Chachoengsao',
  '25': 'Prachin Buri',
  '26': 'Nakhon Nayok',
  '27': 'Sa Kaeo',
  '30': 'Nakhon Ratchasima',
  '31': 'Buriram',
  '32': 'Surin',
  '33': 'Sisaket',
  '34': 'Ubon Ratchathani',
  '35': 'Yasothon',
  '36': 'Chaiyaphum',
  '37': 'Amnat Charoen',
  '38': 'Bueng Kan',
  '39': 'Nong Bua Lamphu',
  '40': 'Khon Kaen',
  '41': 'Udon Thani',
  '42': 'Loei',
  '43': 'Nong Khai',
  '44': 'Maha Sarakham',
  '45': 'Roi Et',
  '46': 'Kalasin',
  '47': 'Sakon Nakhon',
  '48': 'Nakhon Phanom',
  '49': 'Mukdahan',
  '50': 'Chiang Mai',
  '51': 'Lamphun',
  '52': 'Lampang',
  '53': 'Uttaradit',
  '54': 'Phrae',
  '55': 'Nan',
  '56': 'Phayao',
  '57': 'Chiang Rai',
  '58': 'Mae Hong Son',
  '60': 'Nakhon Sawan',
  '61': 'Uthai Thani',
  '62': 'Kamphaeng Phet',
  '63': 'Tak',
  '64': 'Sukhothai',
  '65': 'Phitsanulok',
  '66': 'Phichit',
  '67': 'Phetchabun',
  '70': 'Ratchaburi',
  '71': 'Kanchanaburi',
  '72': 'Suphan Buri',
  '73': 'Nakhon Pathom',
  '74': 'Samut Sakhon',
  '75': 'Samut Songkhram',
  '76': 'Phetchaburi',
  '77': 'Prachuap Khiri Khan',
  '80': 'Nakhon Si Thammarat',
  '81': 'Krabi',
  '82': 'Phang Nga',
  '83': 'Phuket',
  '84': 'Surat Thani',
  '85': 'Ranong',
  '86': 'Chumphon',
  '90': 'Songkhla',
  '91': 'Satun',
  '92': 'Trang',
  '93': 'Phatthalung',
  '94': 'Pattani',
  '95': 'Yala',
  '96': 'Narathiwat',
};

/**
 * ชื่อจีนตัวย่อ อ้างอิงรูปแบบของวิกิพีเดียภาษาจีน (ไม่มีมาตรฐานทางการ แต่ละแหล่งทับศัพท์ต่างกัน)
 * เก็บแบบไม่มีคำว่า 府 แล้วเติมตอนแสดงผล (กรุงเทพฯ ใช้ 曼谷 เฉยๆ)
 */
const ZH: Readonly<Record<string, string>> = {
  '10': '曼谷',
  '11': '北榄',
  '12': '暖武里',
  '13': '巴吞他尼',
  '14': '大城',
  '15': '红统',
  '16': '华富里',
  '17': '信武里',
  '18': '猜纳',
  '19': '北标',
  '20': '春武里',
  '21': '罗勇',
  '22': '尖竹汶',
  '23': '达叻',
  '24': '北柳',
  '25': '巴真',
  '26': '那空那育',
  '27': '沙缴',
  '30': '呵叻',
  '31': '武里南',
  '32': '素林',
  '33': '四色菊',
  '34': '乌汶',
  '35': '益梭通',
  '36': '猜也蓬',
  '37': '安纳乍伦',
  '38': '汶干',
  '39': '廊磨喃蒲',
  '40': '孔敬',
  '41': '乌隆',
  '42': '黎',
  '43': '廊开',
  '44': '玛哈沙拉堪',
  '45': '黎逸',
  '46': '加拉信',
  '47': '沙功那空',
  '48': '那空帕侬',
  '49': '莫拉限',
  '50': '清迈',
  '51': '南奔',
  '52': '南邦',
  '53': '程逸',
  '54': '帕',
  '55': '难',
  '56': '帕尧',
  '57': '清莱',
  '58': '夜丰颂',
  '60': '那空沙旺',
  '61': '乌泰他尼',
  '62': '甘烹碧',
  '63': '达',
  '64': '素可泰',
  '65': '彭世洛',
  '66': '披集',
  '67': '碧差汶',
  '70': '叻丕',
  '71': '北碧',
  '72': '素攀武里',
  '73': '佛统',
  '74': '龙仔厝',
  '75': '夜功',
  '76': '碧武里',
  '77': '巴蜀',
  '80': '洛坤',
  '81': '甲米',
  '82': '攀牙',
  '83': '普吉',
  '84': '素叻他尼',
  '85': '拉廊',
  '86': '春蓬',
  '90': '宋卡',
  '91': '沙敦',
  '92': '董里',
  '93': '博他仑',
  '94': '北大年',
  '95': '惠拉',
  '96': '陶公',
};

/** ชื่อจีนที่แหล่งต่างๆ เขียนไม่ตรงกัน ควรให้คนอ่านภาษาจีนตรวจก่อนใช้งานจริง */
export const ZH_UNVERIFIED: readonly string[] = ["11", "25", "26", "36", "37", "39", "41", "44", "47", "56", "60", "63", "72", "77"];

const BANGKOK = '10';

export function provinceLabel(code: string, lang: Lang): string {
  if (lang === 'en') return EN[code] ?? code;
  if (lang === 'zh') {
    const name = ZH[code];
    return name === undefined ? (EN[code] ?? code) : code === BANGKOK ? name : `${name}府`;
  }
  return PROVINCE_NAME.get(code) ?? code;
}

/** ทุกชื่อของจังหวัด (ไทย อังกฤษ จีน) ใช้ค้นหาข้ามภาษา */
export function provinceSearchNames(code: string): string[] {
  const zh = ZH[code];
  return [PROVINCE_NAME.get(code), EN[code], zh, zh === undefined ? undefined : provinceLabel(code, 'zh')].filter(
    (s): s is string => s !== undefined,
  );
}

const BY_NAME = new Map<string, string>();
for (const code of Object.keys(EN)) {
  for (const name of provinceSearchNames(code)) BY_NAME.set(name.toLowerCase(), code);
}

/** แปลงข้อความที่พิมพ์ (ภาษาใดก็ได้) เป็นรหัสจังหวัด ถ้าตรงกับชื่อเต็มพอดี */
export function provinceFromText(text: string): string | undefined {
  return BY_NAME.get(text.trim().toLowerCase());
}
