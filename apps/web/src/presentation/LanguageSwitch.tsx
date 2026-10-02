import { useI18n } from '../application/I18nContext';
import { LANGS, LANG_NAMES, isLang } from '../domain/i18n';

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <select aria-label={t('language')} value={lang} onChange={(e) => isLang(e.target.value) && setLang(e.target.value)}>
      {LANGS.map((l) => (
        <option key={l} value={l}>{LANG_NAMES[l]}</option>
      ))}
    </select>
  );
}
