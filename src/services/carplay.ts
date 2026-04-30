import { CarPlay } from 'react-native-carplay'
import { getApi } from '../stores'
import { useAutoStore } from '../stores/auto'
import CarPlayNavigation from '../components/CarPlay/Navigation'
import config from '../../react-native.config'
import { Platform } from 'react-native'

function onConnect() {
	const api = getApi()

	if (api) {
		CarPlay.setRootTemplate(CarPlayNavigation)

		CarPlay.enableNowPlaying(true)
	}
	useAutoStore.getState().setIsConnected(true)
}

function onDisconnect() {
	useAutoStore.getState().setIsConnected(false)
}

/**
 * Registers the CarPlay service and sets up event listeners for connection and disconnection.
 *
 * Gated to only run on iOS devices, since we are excluding the `react-native-carplay`
 * dependency on Android.
 *
 * @see {@link config} for how the `react-native-carplay` dependency is excluded from Android builds.
 *
 * @returns A clean-up function
 */
export function registerCarPlayService() {
	if (Platform.OS !== 'ios') return () => {}

	CarPlay.registerOnConnect(onConnect)
	CarPlay.registerOnDisconnect(onDisconnect)

	return () => {
		CarPlay.unregisterOnConnect(onConnect)
		CarPlay.unregisterOnDisconnect(onDisconnect)
	}
}
