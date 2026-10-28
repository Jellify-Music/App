import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
// Start crash reporting before anything else loads (after the console override, so breadcrumbs wrap it)
import './src/utils/logging/sentry'
import { AppRegistry, Platform, __DEV__ } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { enableFreeze, enableScreens } from 'react-native-screens'
import * as Sentry from '@sentry/react-native'
import registerNitroPlayer from './src/services/player'
import configureDownloadManager from './src/services/downloads'
import { Settings } from 'react-native-pulsar'

enableScreens(true)
enableFreeze(true)

Settings.enableSound(false)

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
AppRegistry.registerComponent(appName, () => Sentry.wrap(App))
