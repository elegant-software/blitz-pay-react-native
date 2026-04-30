import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Language, type TranslationKeys } from './translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'de',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');

  function t(key: TranslationKeys, params?: Record<string, string | number>): string {
    const dict = translations[language] ?? translations.en;
    let text = (dict as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
