'use client';

import { useTranslation } from './useTranslation';

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1"
      title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
    >
      {language === 'en' ? '中文' : 'EN'}
    </button>
  );
}
