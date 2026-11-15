import * as Sentry from '@sentry/react-native'
import { GLITCHTIP_DSN } from '../../configs/config'
import { getSendMetricsSetting, useAppSettingsStore } from '../../stores/settings/app'

export const navigationIntegration = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: false,
})

let started = false

/**
 * Strips the server address and query string from HTTP breadcrumbs before sending them to Sentry.
 */
const beforeBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
	if (
		(breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') &&
		typeof breadcrumb.data?.url === 'string'
	) {
		breadcrumb.data.url = breadcrumb.data.url.replace(/^[a-z]+:\/\/[^/]+/i, '').split('?')[0]
	}
	return breadcrumb
}

const startSentry = () => {
	if (started || !GLITCHTIP_DSN) return
	started = true

	Sentry.init({
		dsn: GLITCHTIP_DSN,
		enableNative: !__DEV__,
		environment: __DEV__ ? 'development' : 'production',
		tracesSampleRate: 0.01,
		enableAutoSessionTracking: false,
		sendDefaultPii: false,
		enableLogs: true,
		// HTTP breadcrumbs record the full request URL - strip the server's address
		// and the query string (which can carry an api_key) so only the path is sent
		beforeBreadcrumb,
		integrations: [
			navigationIntegration,
			// console.log is left out - it's too noisy to ship, but still lands in breadcrumbs
			Sentry.consoleLoggingIntegration({ levels: ['info', 'warn', 'error'] }),
		],
	})
}

const stopSentry = async () => {
	if (!started) return
	started = false
	await Sentry.close()
}

const applyConsent = (sendMetrics: boolean) => {
	if (sendMetrics) startSentry()
	else void stopSentry()
}

/**
 * Starts crash reporting and logging only when the user has opted in via "Send Analytics",
 * and follows that setting for the rest of the session.
 *
 * On Android, `MainApplication.kt` reads the same persisted setting to start Sentry before JS loads.
 */
export const initializeSentry = () => {
	applyConsent(getSendMetricsSetting())

	useAppSettingsStore.subscribe((state, previous) => {
		if (state.sendMetrics !== previous.sendMetrics) applyConsent(state.sendMetrics)
	})
}

// Auto-initialize when this module is imported, so errors while the rest of the app loads are caught
initializeSentry()
