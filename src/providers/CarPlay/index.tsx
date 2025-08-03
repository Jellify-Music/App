import CarPlayNavigation from '../../components/CarPlay/Navigation'
import { createContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { CarPlay } from 'react-native-carplay'
import { useJellifyContext } from '../index'
import { useLoadQueueContext } from '../Player/queue'

interface CarPlayContext {
	carplayConnected: boolean
}

const CarPlayContextInitializer = () => {
	const { user, api } = useJellifyContext()
	const [carplayConnected, setCarPlayConnected] = useState(CarPlay ? CarPlay.connected : false)
	const useLoadNewQueue = useLoadQueueContext()

	useEffect(() => {
		function onConnect() {
			setCarPlayConnected(true)

			if (user && api) {
				CarPlay.setRootTemplate(CarPlayNavigation(user, useLoadNewQueue))

				if (Platform.OS === 'ios') {
					CarPlay.enableNowPlaying(true) // https://github.com/birkir/react-native-carplay/issues/185
				}
			}
		}

		function onDisconnect() {
			setCarPlayConnected(false)
		}

		if (CarPlay) {
			CarPlay.registerOnConnect(onConnect)
			CarPlay.registerOnDisconnect(onDisconnect)
			return () => {
				CarPlay.unregisterOnConnect(onConnect)
				CarPlay.unregisterOnDisconnect(onDisconnect)
			}
		}
	})

	return {
		carplayConnected,
	}
}

const CarPlayContext = createContext<CarPlayContext>({
	carplayConnected: false,
})

export const CarPlayProvider = () => {
	const value = CarPlayContextInitializer()
	return <CarPlayContext.Provider value={value} />
}
