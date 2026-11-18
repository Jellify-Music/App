import { useEffect, useRef } from 'react'
import { useNetworkStatusRef, useNetworkStatusBannerStyle } from '../../hooks/network'
import { SizableText, YStack } from 'tamagui'
import Animated from 'react-native-reanimated'
import { useNetworkStatus } from '../../stores/network'
import { NetworkStatuses } from '../../enums/network-status'
import { useApi } from '../../stores/auth'
import { NitroWebSocket } from 'react-native-nitro-websockets'
import { Api } from '@jellyfin/sdk'
import useAppActive from '../../hooks/use-app-active'

const BACK_ONLINE_DISPLAY_MS = 3000
const RECONNECT_INITIAL_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 30000

/**
 * Builds the Jellyfin websocket URL, matching what the SDK's own websocket service connects to
 */
const getSocketUrl = (api: Api) =>
	api.getUri('socket', { ApiKey: api.accessToken }).replace(/^http/, 'ws')

const InternetConnectionWatcher = () => {
	const api = useApi()
	const isAppActive = useAppActive()

	const [networkStatus, setNetworkStatus, statusDisplayText] = useNetworkStatus()

	const lastNetworkStatus = useNetworkStatusRef(networkStatus)

	const animatedStyle = useNetworkStatusBannerStyle(networkStatus)

	const clearStatusTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	const clearNetworkStatus = () => {
		if (lastNetworkStatus.current !== NetworkStatuses.DISCONNECTED) {
			setNetworkStatus(null)
		}
	}

	const internetConnectionBack = () => {
		setNetworkStatus(NetworkStatuses.ONLINE)
		clearTimeout(clearStatusTimeout.current)
		clearStatusTimeout.current = setTimeout(clearNetworkStatus, BACK_ONLINE_DISPLAY_MS)
	}

	useEffect(() => () => clearTimeout(clearStatusTimeout.current), [])

	useEffect(() => {
		// Hold off connecting while backgrounded, the OS will drop the socket anyway
		if (!api || !isAppActive) return

		let socket: NitroWebSocket | null = null
		let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
		let reconnectAttempts = 0

		const disposeSocket = () => {
			if (!socket) return

			// Detach handlers first so closing doesn't report a disconnect
			socket.onopen = null
			socket.onerror = null
			socket.onclose = null
			socket.close()
			socket = null
		}

		const handleDisconnect = () => {
			disposeSocket()
			setNetworkStatus(NetworkStatuses.DISCONNECTED)

			const delay = Math.min(
				RECONNECT_INITIAL_DELAY_MS * 2 ** reconnectAttempts,
				RECONNECT_MAX_DELAY_MS,
			)
			reconnectAttempts++
			reconnectTimeout = setTimeout(connect, delay)
		}

		const connect = () => {
			socket = new NitroWebSocket(getSocketUrl(api))

			socket.onopen = () => {
				reconnectAttempts = 0

				// Only announce a reconnect, not the initial connection
				if (lastNetworkStatus.current === NetworkStatuses.DISCONNECTED) {
					internetConnectionBack()
				}
			}
			socket.onerror = handleDisconnect
			socket.onclose = handleDisconnect
		}

		connect()

		return () => {
			clearTimeout(reconnectTimeout)
			disposeSocket()
		}
	}, [api, isAppActive])

	return (
		<Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
			<YStack
				height='1-5'
				justifyContent='center'
				alignContent='center'
				backgroundColor={`${networkStatus === NetworkStatuses.ONLINE ? 'success' : 'warning'}`}
			>
				<SizableText fontSize='2' fontWeight='6' textAlign='center' color='background'>
					{networkStatus === networkStatusTypes.ONLINE
						? t('network.backOnline')
						: t('network.offline')}
				</SizableText>
			</YStack>
		</Animated.View>
	)
}

export default InternetConnectionWatcher
