import { describe, expect, it } from 'vitest';
import { LANGS, MESSAGES, detectLang, translate } from './i18n';
import { PROVINCE_LIST } from './provinces';
import { ZH_UNVERIFIED, provinceFromText, provinceLabel } from './provinceNames';

const vars = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();

describe('ข้อความ 3 ภาษา', () => {
  it('ทุกภาษามีครบทุกคีย์ ไม่ว่าง และตัวแปร {..} ตรงกับภาษาไทย', () => {
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang])).toEqual(Object.keys(MESSAGES.th));
      for (const [key, text] of Object.entries(MESSAGES[lang])) {
        expect(text.trim(), `${lang}.${key}`).not.toBe('');
        expect(vars(text), `${lang}.${key}`).toEqual(vars(MESSAGES.th[key as keyof typeof MESSAGES.th]));
      }
    }
  });

  it('แทนตัวแปรในข้อความ', () => {
    expect(translate('en', 'titleProvince', { prov: 'Phuket', n: 3 })).toBe('Phuket: 3 technician(s)');
    expect(translate('zh', 'titleProvince', { prov: '普吉府', n: 3 })).toBe('普吉府：3 位技师');
  });
});

describe('เลือกภาษา', () => {
  it('ใช้ค่าที่บันทึกไว้ก่อน แล้วค่อยดูเบราว์เซอร์ ไม่เข้าพวกใช้ไทย', () => {
    expect(detectLang('en', ['th-TH'])).toBe('en');
    expect(detectLang(null, ['zh-CN', 'en'])).toBe('zh');
    expect(detectLang('xx', ['fr-FR', 'en-US'])).toBe('en');
    expect(detectLang(null, ['fr-FR'])).toBe('th');
  });
});

describe('ชื่อจังหวัด', () => {
  it('ครบ 77 จังหวัดในทุกภาษา และชื่อไม่ซ้ำกันภายในภาษาเดียวกัน', () => {
    expect(PROVINCE_LIST).toHaveLength(77);
    for (const lang of LANGS) {
      const names = PROVINCE_LIST.map((p) => provinceLabel(p.code, lang));
      expect(new Set(names).size, lang).toBe(77);
      expect(names.every((n) => n !== '' && !/^\d+$/.test(n)), lang).toBe(true);
    }
  });

  it('จีนเติม 府 ยกเว้นกรุงเทพฯ และรายชื่อที่ต้องตรวจเป็นรหัสที่มีจริง', () => {
    expect(provinceLabel('50', 'zh')).toBe('清迈府');
    expect(provinceLabel('10', 'zh')).toBe('曼谷');
    expect(ZH_UNVERIFIED.every((c) => PROVINCE_LIST.some((p) => p.code === c))).toBe(true);
  });

  it('พิมพ์ชื่อภาษาใดก็จับเป็นจังหวัดเดียวกัน', () => {
    expect(provinceFromText('เชียงใหม่')).toBe('50');
    expect(provinceFromText(' chiang mai ')).toBe('50');
    expect(provinceFromText('清迈')).toBe('50');
    expect(provinceFromText('清迈府')).toBe('50');
    expect(provinceFromText('ไม่มีจริง')).toBeUndefined();
  });
});
