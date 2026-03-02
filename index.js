import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { enableFreeze, enableScreens } from 'react-native-screens'

enableScreens(true)
enableFreeze(true)

AppRegistry.registerComponent(appName, () => App)
