import 'react-native-gesture-handler'
import './globals'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
import { AppRegistry, Platform, __DEV__ } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { enableFreeze, enableScreens } from 'react-native-screens'
import { GLITCHTIP_DSN } from './src/configs/config'
import * as Sentry from '@sentry/react-native'
import registerNitroPlayer from './src/services/player'
import configureDownloadManager from './src/services/downloads'
import { cacheService } from './src/cache/service'

enableScreens(true)
enableFreeze(true)

Sentry.init({
	dsn: GLITCHTIP_DSN,
	enableNative: !__DEV__,
	tracesSampleRate: 0.01,
	enableAutoSessionTracking: false,
	enabled: !!GLITCHTIP_DSN,
})

registerNitroPlayer()
configureDownloadManager()

// Migrate legacy auto-download users and reconcile the cache ledger against
// disk truth (adopts pre-ledger downloads, recovers stuck download state)
void cacheService.initialize()

// Lazy require the CarPlayService on iOS so react-native-carplay's native
// module is never accessed on Android, as it's only linked for iOS in react-native.config.js
if (Platform.OS === 'ios') {
	const { registerCarPlayService } = require('./src/services/carplay')
	registerCarPlayService()
} else if (Platform.OS === 'android') {
	const { registerAndroidAutoService } = require('./src/services/android-auto')
	registerAndroidAutoService()
}
AppRegistry.registerComponent(appName, () => App)
