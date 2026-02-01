import { CarPlay } from 'react-native-carplay'

export function registerAutoService(onConnect: () => void, onDisconnect: () => void) {
	CarPlay.registerOnConnect(onConnect)
	CarPlay.registerOnDisconnect(onDisconnect)

	return () => {
		CarPlay.unregisterOnConnect(onConnect)
		CarPlay.unregisterOnDisconnect(onDisconnect)
	}
}
