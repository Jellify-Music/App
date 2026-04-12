import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
import { AppRegistry, __DEV__ } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { enableFreeze, enableScreens } from 'react-native-screens'
import { GLITCHTIP_DSN } from './src/configs/config'
import * as Sentry from '@sentry/react-native'

enableScreens(true)
enableFreeze(true)

Sentry.init({
	dsn: GLITCHTIP_DSN,
	enableNative: !__DEV__,
	tracesSampleRate: 0.01,
	enableAutoSessionTracking: false,
	enabled: !!GLITCHTIP_DSN,
})

AppRegistry.registerComponent(appName, () => App)
