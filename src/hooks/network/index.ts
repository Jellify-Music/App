import { NetworkStatuses } from '../../enums/network-status'
import { useRef, useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { getTokenValue } from 'tamagui'

/**
 * A hook to keep track of the last known network status.
 *
 * @param networkStatus The current network status to track
 *
 * @returns A ref object containing the last known network status
 */
export const useNetworkStatusRef = (networkStatus: NetworkStatuses | null) => {
	const lastNetworkStatus = useRef<NetworkStatuses | null>(networkStatus)

	useEffect(() => {
		lastNetworkStatus.current = networkStatus
	}, [networkStatus])

	return lastNetworkStatus
}

/**
 * A hook to manage the animated style of the network status banner based on the current network status.
 *
 * @param networkStatus The current network status to track for the banner animation
 *
 * @returns The animated style for the network status banner
 */
export const useNetworkStatusBannerStyle = (networkStatus: NetworkStatuses | null) => {
	const bannerHeight = useSharedValue(0)
	const opacity = useSharedValue(0)

	const animateBannerIn = () => {
		bannerHeight.set(
			withSpring(getTokenValue('8'), {
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

	useEffect(() => {
		if (networkStatus === NetworkStatuses.DISCONNECTED) {
			animateBannerIn()
		} else if (networkStatus === NetworkStatuses.ONLINE) {
			animateBannerIn()

			// Finish sliding out before the status is cleared and the text changes
			const hideTimeout = setTimeout(animateBannerOut, 2800)
			return () => clearTimeout(hideTimeout)
		} else if (networkStatus === null) {
			animateBannerOut()
		}
	}, [networkStatus])

	return animatedStyle
}
