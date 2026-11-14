import Toast from 'react-native-toast-message'
import Clipboard from '@react-native-clipboard/clipboard'
import { captureError, LoggingContext } from './logging'
import { applyHapticFeedback } from './haptics'

/**
 * Handles an error the user should know about: logs it (and reports it to Sentry
 * if enabled), gives error haptic feedback, and shows an error toast with the
 * error's message that can be tapped to copy the message to the clipboard
 * @param error The error that occurred
 * @param context The {@link LoggingContext} the error occurred in
 * @param title The headline of the toast
 * @param message The message to log and report, if it should differ from the title.
 * Use this to keep personal details, like the server address, out of Sentry
 */
export function handleError(
	error: unknown,
	context: LoggingContext,
	title: string,
	message: string = title,
) {
	captureError(error, context, message)

	applyHapticFeedback('error')

	const errorMessage = error instanceof Error ? error.message : String(error)

	Toast.show({
		text1: title,
		text2: errorMessage,
		type: 'error',
		onPress: () => Clipboard.setString(errorMessage),
	})
}
