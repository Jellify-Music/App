import { Platform } from 'react-native'

/**
 * Lazily registers the appropriate auto service (CarPlay on iOS, Android Auto on Android) based on the platform.
 */
export default function registerAutoService() {
	if (Platform.OS === 'ios') {
		const { registerCarPlayService } = require('./carplay')
		registerCarPlayService()
	} else if (Platform.OS === 'android') {
		const { registerAndroidAutoService } = require('./android-auto')
		registerAndroidAutoService()
	}
}
