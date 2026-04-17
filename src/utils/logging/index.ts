import { getSendMetricsSetting } from '../../stores/settings/app'
import * as Sentry from '@sentry/react-native'
import LoggingContext from './enums'

export const captureError = (error: unknown, context: Record<LoggingContext, unknown>) => {
	console.error('Captured Error:', error, 'Context:', context)

	const sendMetrics = getSendMetricsSetting()
	if (sendMetrics) {
		Sentry.captureException(error, {
			contexts: {
				logging: context,
			},
		})
	}
}
