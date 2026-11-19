import Toast from 'react-native-toast-message'
import Clipboard from '@react-native-clipboard/clipboard'
import { captureError, LoggingContext } from './logging'
import { applyHapticFeedback } from './haptics'
import { TOptions } from 'i18next'
import i18n from '../i18n'
import type en from '../i18n/locales/en.json'

type ErrorTitle = keyof (typeof en)['errors']

/**
 * Handles an error the user should know about: logs it (and reports it to Sentry
 * if enabled), gives error haptic feedback, and shows an error toast with the
 * error's message that can be tapped to copy the message to the clipboard
 * @param error The error that occurred
 * @param context The {@link LoggingContext} the error occurred in
 * @param title The key of the toast's headline, under `errors` in the locale files
 * @param values Values to interpolate into the title
 * @param message The message to log and report, if it should differ from the English title.
 * Use this to keep personal details, like the server address, out of Sentry
 */
export function handleError(
	error: unknown,
	context: LoggingContext,
	title: ErrorTitle,
	values?: TOptions,
	message: string = i18n.t(`errors.${title}`, { ...values, lng: 'en' }),
) {
	captureError(error, context, message)

	applyHapticFeedback('error')

	const errorMessage = error instanceof Error ? error.message : String(error)

	Toast.show({
		text1: i18n.t(`errors.${title}`, values ?? {}),
		text2: errorMessage,
		type: 'error',
		onPress: () => Clipboard.setString(errorMessage),
	})
}
