import { useLanguageContext } from './LanguageContext';

export function useTranslation() {
  return useLanguageContext();
}
