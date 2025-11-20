import NetInfo from '@react-native-community/netinfo'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { getTokenValue, YStack } from 'tamagui'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import { Text } from '../Global/helpers/text'
import { useNetworkStatus } from '../../stores/network/connectivity'
import useWebSocket from '../../api/queries/websocket'

const internetConnectionWatcher = {
	NO_INTERNET: 'You are offline',
	NO_WEBSOCKET: 'You are disconnected',
	BACK_ONLINE: "And we're back!",
}

export enum networkStatusTypes {
	ONLINE = 'ONLINE',
	DISCONNECTED = 'DISCONNECTED',
	OFFLINE = 'OFFLINE',
}

const isAndroid = Platform.OS === 'android'

const InternetConnectionWatcher = () => {
	const lastNetworkStatus = useRef<networkStatusTypes | null>(networkStatusTypes.ONLINE)
	const [networkStatus, setNetworkStatus] = useNetworkStatus()

	const socketState = useWebSocket(networkStatus ?? networkStatusTypes.ONLINE)

	const bannerHeight = useSharedValue(0)
	const opacity = useSharedValue(0)

	const animateBannerIn = () => {
		bannerHeight.value = withTiming(getTokenValue('$8'), {
			duration: 300,
			easing: Easing.out(Easing.ease),
		})
		opacity.value = withTiming(1, { duration: 300 })
	}

	const animateBannerOut = () => {
		bannerHeight.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
		opacity.value = withTiming(0, { duration: 200 })
	}

	const animatedStyle = useAnimatedStyle(() => {
		return {
			height: bannerHeight.value,
			opacity: opacity.value,
		}
	})

	const changeNetworkStatus = () => {
		if (lastNetworkStatus.current !== networkStatusTypes.OFFLINE) {
			setNetworkStatus(null)
		}
	}

	const internetConnectionBack = () => {
		setNetworkStatus(networkStatusTypes.ONLINE)
		setTimeout(() => {
			runOnJS(changeNetworkStatus)() // hide text after 3s
		}, 3000)
	}

	useEffect(() => {
		lastNetworkStatus.current = networkStatus
	}, [networkStatus])

	useEffect(() => {
		if (
			networkStatus === networkStatusTypes.OFFLINE ||
			networkStatus === networkStatusTypes.DISCONNECTED
		) {
			animateBannerIn()
		} else if (networkStatus === networkStatusTypes.ONLINE) {
			animateBannerIn()
			setTimeout(() => {
				animateBannerOut()
			}, 2800)
		} else if (networkStatus === null) {
			animateBannerOut()
		}
	}, [networkStatus])

	useEffect(() => {
		const networkWatcherListener = NetInfo.addEventListener(
			({ isConnected, isInternetReachable }) => {
				const isNetworkDisconnected = !(
					isConnected && (isAndroid ? isInternetReachable : true)
				)

				if (isNetworkDisconnected) {
					setNetworkStatus(networkStatusTypes.OFFLINE)
				}
			},
		)
		return () => {
			networkWatcherListener()
		}
	}, [])

	useEffect(() => {
		if (socketState === 'open') internetConnectionBack()
		else setNetworkStatus(networkStatusTypes.DISCONNECTED)
	}, [socketState])

	return (
		<Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
			<YStack
				height={'$1.5'}
				justifyContent='center'
				alignContent='center'
				backgroundColor={
					networkStatus === networkStatusTypes.ONLINE ? '$success' : '$danger'
				}
			>
				<Text textAlign='center' color='$black'>
					{networkStatus === networkStatusTypes.ONLINE
						? internetConnectionWatcher.BACK_ONLINE
						: networkStatus === networkStatusTypes.DISCONNECTED
							? internetConnectionWatcher.NO_WEBSOCKET
							: internetConnectionWatcher.NO_INTERNET}
				</Text>
			</YStack>
		</Animated.View>
	)
}

export default InternetConnectionWatcher
