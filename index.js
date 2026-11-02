import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
// Start crash reporting before anything else loads (after the console override, so breadcrumbs wrap it)
import './src/utils/logging/sentry'
import { AppRegistry, __DEV__ } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { enableFreeze, enableScreens } from 'react-native-screens'
import * as Sentry from '@sentry/react-native'
import registerServices from './src/services'
import { Settings } from 'react-native-pulsar'

enableScreens(true)
enableFreeze(true)

Settings.enableSound(false)

registerServices()

AppRegistry.registerComponent(appName, () => Sentry.wrap(App))
