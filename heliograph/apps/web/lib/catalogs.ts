import en from '@heliograph/i18n/catalogs/en';
import pseudo from '@heliograph/i18n/catalogs/en-x-pseudo';
import tr from '@heliograph/i18n/catalogs/tr';
import type { Messages } from '@lingui/core';

/** Pre-compiled catalogs (packages/i18n `build-catalogs`); adding a locale = one line here. */
export const CATALOGS: Readonly<Record<string, Messages>> = {
  tr: tr as unknown as Messages,
  en: en as unknown as Messages,
  'en-x-pseudo': pseudo as unknown as Messages,
};
