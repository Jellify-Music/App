import { getSendMetricsSetting } from '../../stores/settings/app'
import * as Sentry from '@sentry/react-native'
import LoggingContext from './enums'

export { default as LoggingContext } from './enums'

export const captureError = (error: unknown, context: LoggingContext, message?: string) => {
	console.error(`Captured Error [${context}]:`, message ?? '', error)

	const sendMetrics = getSendMetricsSetting()
	if (sendMetrics) {
		Sentry.captureException(error, {
			contexts: {
				logging: { context, message },
			},
		})
	}
}

export const captureWarning = (context: LoggingContext, message: string, error?: unknown) => {
	console.warn(`Captured Warning [${context}]:`, message, error ?? '')

	const sendMetrics = getSendMetricsSetting()
	if (sendMetrics) {
		Sentry.captureMessage(message, {
			level: 'warning',
			contexts: {
				logging: { context, error: error ? String(error) : undefined },
			},
		})
	}
}

export const captureInfo = (context: LoggingContext, message: string) => {
	console.info(`[${context}]:`, message)
}
