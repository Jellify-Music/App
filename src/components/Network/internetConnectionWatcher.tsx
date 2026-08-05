import NetInfo from '@react-native-community/netinfo'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { getTokenValue, Paragraph, YStack } from 'tamagui'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
} from 'react-native-reanimated'

import { useIsConnectionActive, useNetworkStore } from '../../stores/network'
import NetworkStatus from '../../enums/network'
import { NitroWebSocket } from 'react-native-nitro-websockets'
import { useApi } from '../../stores/auth'
import { onSocketClose } from './socket-event-handlers'
import establishSocketConnection from './socket-event-handlers'
import { NETWORK_BANNER_ANIMATION_TIMING } from './config'
import { setNetworkStatus } from '../../stores/network/utils'

// Reduce the frequency of Android ConnectivityManager.registerNetworkCallbacks
// to avoid a TooManyRequestsException.
NetInfo.configure({
	reachabilityLongTimeout: 60 * 1000, // 60 s (default 10 s)
	reachabilityShortTimeout: 10 * 1000, // 10 s (default 1 s)
	reachabilityRequestTimeout: 30 * 1000, // 30 s (default 15 s)
})

const internetConnectionWatcher = {
	NO_INTERNET: 'You are offline',
	BACK_ONLINE: "And we're back!",
}

const isAndroid = Platform.OS === 'android'

const InternetConnectionWatcher = () => {
	const api = useApi()
	const isConnectionActive = useIsConnectionActive()

	const wasConnectionActive = useRef<boolean>(false)
	const socketRef = useRef<NitroWebSocket | null>(null)

	const bannerHeight = useSharedValue(0)
	const opacity = useSharedValue(0)

	const animateBannerIn = () => {
		bannerHeight.set(
			withSpring(getTokenValue('$8'), {
				duration: 300,
			}),
		)
		opacity.set(withTiming(1, { duration: 300 }))
	}

	const animateBannerOut = () => {
		bannerHeight.set(withSpring(0, { duration: 300 }))
		opacity.set(withTiming(0, { duration: 300 }))
	}

	const animatedStyle = useAnimatedStyle(() => {
		return {
			height: bannerHeight.get(),
			opacity: opacity.get(),
		}
	})

	const internetConnectionBack = () => {
		if (api) {
			socketRef.current = establishSocketConnection(api)

			socketRef.current.onclose = () => {
				onSocketClose()
			}
		}
	}

	useEffect(() => {
		if (!isConnectionActive && wasConnectionActive.current) {
			animateBannerIn()
		} else if (isConnectionActive && wasConnectionActive.current) {
			// Dismiss network banner after three seconds
			setTimeout(() => {
				animateBannerOut()
			}, NETWORK_BANNER_ANIMATION_TIMING)
		}

		wasConnectionActive.current = isConnectionActive
	}, [isConnectionActive])

	useEffect(() => {
		return NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
			const isNetworkDisconnected = !(isConnected && (isAndroid ? isInternetReachable : true))

			if (isNetworkDisconnected) {
				setNetworkStatus(NetworkStatus.DISCONNECTED)
			} else {
				internetConnectionBack()
			}
		})
	}, [])

	return (
		<Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
			<YStack
				height={'$1.5'}
				justifyContent='center'
				alignContent='center'
				backgroundColor={isConnectionActive ? '$success' : '$warning'}
			>
				<Paragraph fontWeight={'$6'} textAlign='center' color='$background'>
					{isConnectionActive
						? internetConnectionWatcher.BACK_ONLINE
						: internetConnectionWatcher.NO_INTERNET}
				</Paragraph>
			</YStack>
		</Animated.View>
	)
}

export default InternetConnectionWatcher
