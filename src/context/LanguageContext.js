/**
 * LanguageContext — provides the current language, translation function,
 * and a setter. Persists choice to localStorage and toggles <html lang/dir>.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  translations,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from '../i18n/translations';

const STORAGE_KEY = 'ballers_language';

const LanguageContext = createContext(null);

const isSupported = (code) =>
  SUPPORTED_LANGUAGES.some((lang) => lang.code === code);

const resolvePath = (dict, path) => {
  let node = dict;
  for (const segment of path.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[segment];
  }
  return node;
};

const interpolate = (template, vars) => {
  if (typeof template !== 'string' || !vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
};

const detectInitialLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isSupported(stored)) return stored;
  const browser = (window.navigator?.language || '').toLowerCase();
  if (browser.startsWith('he')) return 'he';
  return DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = useCallback((code) => {
    if (!isSupported(code)) return;
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore quota / private mode errors */
    }
  }, []);

  useEffect(() => {
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (meta && typeof document !== 'undefined') {
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.dir;
    }
  }, [language]);

  const t = useCallback(
    (key, vars) => {
      const value =
        resolvePath(translations[language], key) ??
        resolvePath(translations[DEFAULT_LANGUAGE], key);
      if (value === undefined) return key;
      return interpolate(value, vars);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      dir: SUPPORTED_LANGUAGES.find((l) => l.code === language)?.dir || 'ltr',
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}

export function useLanguage() {
  return useTranslation();
}
