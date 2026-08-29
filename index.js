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

enableScreens(true)
enableFreeze(true)

Sentry.init({
	dsn: GLITCHTIP_DSN,
	enableNative: !__DEV__,
	tracesSampleRate: 0.01,
	enableAutoSessionTracking: false,
	enabled: !!GLITCHTIP_DSN,
})

// KNOWN ISSUE (Android): NitroPlayerPlaybackService outlives a UI crash. When the JS
// side dies, the foreground media service is restarted by the system and keeps the
// process alive, so tapping the launcher icon resumes a dead process and nothing draws.
// Only `adb shell am force-stop com.cosmonautical.jellify` clears it. Observed via:
//
//   dumpsys activity services com.cosmonautical.jellify
//   -> crashCount=1 restartCount=1 isForeground=false, and every FGS allow-check DENIED
//      (targetSdkVersion=36, so Android 16 foreground-service restrictions apply)
//
// Practical impact while debugging: force-stop between runs, or you may be testing a
// zombie process. A proper fix likely means tearing the service down when the React
// instance is destroyed, and not calling startForeground when the checks will deny it.
registerNitroPlayer()
configureDownloadManager()

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
