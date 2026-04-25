import { CarPlay } from 'react-native-carplay'
import { Platform } from 'react-native'
import { getApi } from '../stores'
import { useAutoStore } from '../stores/auto'
import CarPlayNavigation from '../components/CarPlay/Navigation'

function onConnect() {
	const api = getApi()

	if (api) {
		CarPlay.setRootTemplate(CarPlayNavigation)

		if (Platform.OS === 'ios') {
			CarPlay.enableNowPlaying(true)
		}
	}
	useAutoStore.getState().setIsConnected(true)
}

function onDisconnect() {
	useAutoStore.getState().setIsConnected(false)
}

export default function registerCarPlayService() {
	CarPlay.registerOnConnect(onConnect)
	CarPlay.registerOnDisconnect(onDisconnect)

	return () => {
		CarPlay.unregisterOnConnect(onConnect)
		CarPlay.unregisterOnDisconnect(onDisconnect)
	}
}
