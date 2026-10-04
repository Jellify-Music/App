import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { getTokenValue, Paragraph, YStack } from 'tamagui'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import { useNetworkStatus } from '../../stores/network'
import { useApi } from '../../stores/auth'
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket'
import { NetworkStatusMessages } from '@/src/configs/messaging/network-status'

export enum networkStatusTypes {
	ONLINE = 'ONLINE',
	DISCONNECTED = 'DISCONNECTED',
}

const isAndroid = Platform.OS === 'android'

const InternetConnectionWatcher = () => {
	const api = useApi()

	const lastNetworkStatus = useRef<networkStatusTypes | null>(networkStatusTypes.ONLINE)
	const [networkStatus, setNetworkStatus] = useNetworkStatus()

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
		opacity.set(withTiming(0, { duration: 200 }))
	}

	const animatedStyle = useAnimatedStyle(() => {
		return {
			height: bannerHeight.get(),
			opacity: opacity.get(),
		}
	})

	const changeNetworkStatus = () => {
		if (lastNetworkStatus.current !== networkStatusTypes.DISCONNECTED) {
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
		if (networkStatus === networkStatusTypes.DISCONNECTED) {
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
		const networkWatcherListener = api?.subscribe(
			[OutboundWebSocketMessageType.KeepAlive],
			(handler) => {},
		)
		return () => {
			networkWatcherListener?.()
		}
	}, [api])

	const statusDisplayText =
		networkStatus === networkStatusTypes.ONLINE
			? NetworkStatusMessages.BACK_ONLINE
			: NetworkStatusMessages.NO_INTERNET

	return (
		<Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
			<YStack
				height={'$1.5'}
				justifyContent='center'
				alignContent='center'
				backgroundColor={
					networkStatus === networkStatusTypes.ONLINE ? '$success' : '$warning'
				}
			>
				<Paragraph fontWeight={'$6'} textAlign='center' color='$background'>
					{statusDisplayText}
				</Paragraph>
			</YStack>
		</Animated.View>
	)
}

export default InternetConnectionWatcher
