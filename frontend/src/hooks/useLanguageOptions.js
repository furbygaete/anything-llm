import i18n, { SUPPORTED_LANGUAGES } from "@/i18n";

export function useLanguageOptions() {
  const supportedLanguages = SUPPORTED_LANGUAGES;
  const languageNames = new Intl.DisplayNames(supportedLanguages, {
    type: "language",
  });
  const changeLanguage = (newLang = "en") => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return false;
    i18n.changeLanguage(newLang);
  };

  return {
    currentLanguage: i18n.resolvedLanguage || "en",
    supportedLanguages,
    getLanguageName: (lang = "en") => languageNames.of(lang),
    changeLanguage,
  };
}
