import { getSendMetricsSetting } from '../../stores/settings/app'
import * as Sentry from '@sentry/react-native'

export const captureError = (error: unknown, context: Record<string, unknown>) => {
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
