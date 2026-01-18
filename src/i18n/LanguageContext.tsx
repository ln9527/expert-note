'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, TranslationContextType, STORAGE_KEY, DEFAULT_LANGUAGE } from './types';
import en from './locales/en.json';
import zh from './locales/zh.json';

const translations: Record<Language, typeof en> = { en, zh };

const LanguageContext = createContext<TranslationContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  // Save language preference to localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Update html lang attribute
    document.documentElement.lang = lang;
  }, []);

  // Translation function with parameter interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return key if translation not found
        console.warn(`Translation not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters like {count}, {name}, etc.
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() ?? `{${paramKey}}`;
      });
    }

    return value;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  // Prevent hydration mismatch by rendering with default language until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ ...contextValue, language: DEFAULT_LANGUAGE }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}
