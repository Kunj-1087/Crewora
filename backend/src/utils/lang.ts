import { Request } from 'express';
import en from '../constants/translations/en.json';
import gu from '../constants/translations/gu.json';

const translations: Record<'en' | 'gu', any> = { en, gu };

/**
 * Translates a key using a dot-notated path (e.g. 'errors.invalid_otp') for a given language.
 */
export function translateBackend(
  key: string,
  lang: 'en' | 'gu',
  variables?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[lang] || translations['en'];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      break;
    }
  }

  // Fallback to English if not found in Gujarati
  if (typeof value !== 'string' && lang !== 'en') {
    let fallbackValue: any = translations['en'];
    for (const k of keys) {
      if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
        fallbackValue = fallbackValue[k];
      } else {
        fallbackValue = null;
        break;
      }
    }
    if (typeof fallbackValue === 'string') {
      value = fallbackValue;
    }
  }

  if (typeof value !== 'string') {
    return key; // Return raw key as fallback
  }

  // Replace variables in format {varName}
  if (variables) {
    return Object.entries(variables).reduce((str, [k, val]) => {
      return str.replace(new RegExp(`{${k}}`, 'g'), String(val));
    }, value);
  }

  return value;
}

/**
 * Detects the language preference from the Accept-Language header of the request.
 */
export function getLanguageFromRequest(req: Request): 'en' | 'gu' {
  const acceptLang = req.headers['accept-language'];
  if (acceptLang) {
    const langLower = acceptLang.toLowerCase();
    if (langLower.includes('gu') || langLower.includes('gu-in')) {
      return 'gu';
    }
  }
  return 'en';
}
