import CarPlayNavigation from '../../components/CarPlay/Navigation'
import { createContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { CarPlay } from 'react-native-carplay'
import { useJellifyContext } from '../index'
import { useLoadNewQueue } from '../Player/hooks/mutations'
import { useNetworkContext } from '../Network'
import { useDownloadQualityContext } from '../Settings'
import useStreamingDeviceProfile from '../../stores/device-profile'
import { useAllDownloadedTracks } from '../../api/queries/download'

interface CarPlayContext {
	carplayConnected: boolean
}

const CarPlayContextInitializer = () => {
	const { api, library } = useJellifyContext()
	const [carplayConnected, setCarPlayConnected] = useState(CarPlay ? CarPlay.connected : false)

	const { networkStatus } = useNetworkContext()

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const deviceProfile = useStreamingDeviceProfile()
	const downloadQuality = useDownloadQualityContext()

	const { mutate: loadNewQueue } = useLoadNewQueue()

	useEffect(() => {
		function onConnect() {
			setCarPlayConnected(true)

			if (api && library) {
				CarPlay.setRootTemplate(
					CarPlayNavigation(
						library,
						loadNewQueue,
						api,
						downloadedTracks,
						networkStatus,
						deviceProfile,
						downloadQuality,
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
