export * from './types';
export * from './validators/auth.schemas';
export * from './validators/job.schemas';

import enTranslations from './constants/translations/en.json';
import guTranslations from './constants/translations/gu.json';

export const translations = {
  en: enTranslations,
  gu: guTranslations,
};
