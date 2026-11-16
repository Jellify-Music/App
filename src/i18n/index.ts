import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

/**
 * Translation resources, keyed by language code.
 *
 * English is the source language. Other locale files are written by Weblate,
 * and should be registered here when they're added.
 */
export const resources = {
	en: { translation: en },
} as const

/**
 * Uses Hermes' Intl support to read the device language, so no native
 * module is needed and translation updates can ship over OTA.
 *
 * Hermes doesn't implement Intl.Locale, so the language subtag is
 * parsed from the BCP 47 tag directly
 *
 * @see {@link https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md | Hermes Intl APIs}
 */
const deviceLanguage = Intl.DateTimeFormat().resolvedOptions().locale.split(/[-_]/)[0]

i18n.use(initReactI18next).init({
	resources,
	lng: deviceLanguage,
	fallbackLng: 'en',
	// Resources are bundled, so initialize synchronously. Navigation options
	// and services translate strings when their modules load
	initAsync: false,
	interpolation: {
		// React already escapes rendered values
		escapeValue: false,
	},
})

export default i18n
