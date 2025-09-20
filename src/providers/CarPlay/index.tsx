import CarPlayNavigation from '../../components/CarPlay/Navigation'
import { createContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { CarPlay } from 'react-native-carplay'
import { useJellifyContext } from '../index'
import { useLoadNewQueue } from '../Player/hooks/mutations'
import { useNetworkStatus } from '../../stores/network'
import useStreamingDeviceProfile from '../../stores/device-profile'

interface CarPlayContext {
	carplayConnected: boolean
}

const CarPlayContextInitializer = () => {
	const { api, user, library } = useJellifyContext()
	const [carplayConnected, setCarPlayConnected] = useState(CarPlay ? CarPlay.connected : false)

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const loadNewQueue = useLoadNewQueue()

	useEffect(() => {
		function onConnect() {
			setCarPlayConnected(true)

			if (api && library) {
				CarPlay.setRootTemplate(
					CarPlayNavigation(
						library,
						loadNewQueue,
						api,
						user,
						networkStatus,
						deviceProfile,
					),
				)

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
