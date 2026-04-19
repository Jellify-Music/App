import { getSendMetricsSetting } from '../../stores/settings/app'
import * as Sentry from '@sentry/react-native'
import LoggingContext from './enums'

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
