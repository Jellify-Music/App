import 'react-native-gesture-handler'
// Initialize console override early - disable all console methods in production
import './src/utils/console-override'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { PlaybackService } from './src/player'
import TrackPlayer from 'react-native-track-player'
import { enableScreens } from 'react-native-screens'

enableScreens(true)

AppRegistry.registerComponent(appName, () => App)

// Register RNTP playback service for remote controls
TrackPlayer.registerPlaybackService(() => PlaybackService)
