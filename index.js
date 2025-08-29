import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { PlaybackService } from './src/player/service'
import TrackPlayer from 'react-native-track-player'
import { enableFreeze, enableScreens } from 'react-native-screens'

enableScreens(true)
enableFreeze(true)

AppRegistry.registerComponent(appName, () => App)
AppRegistry.registerComponent('RNCarPlayScene', () => App)

// Register RNTP playback service for remote controls
TrackPlayer.registerPlaybackService(() => PlaybackService)
