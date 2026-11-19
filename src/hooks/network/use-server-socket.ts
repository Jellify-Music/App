import { useEffect, useRef } from 'react'
import { NitroWebSocket } from 'react-native-nitro-websockets'
import { Api } from '@jellyfin/sdk'
import { useApi } from '../../stores/auth'
import useAppActive from '../use-app-active'

const RECONNECT_INITIAL_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 30000

/**
 * Builds the Jellyfin websocket URL, matching what the SDK's own websocket service connects to
 */
const getSocketUrl = (api: Api) =>
	api.getUri('socket', { ApiKey: api.accessToken }).replace(/^http/, 'ws')

type ServerSocketHandlers = {
	onConnect: () => void
	onDisconnect: () => void
}

/**
 * A hook that keeps a websocket open to the Jellyfin server while the app is in the foreground,
 * reconnecting with exponential backoff when the connection drops.
 *
 * @param handlers Callbacks invoked when the socket connects or disconnects
 */
const useServerSocket = (handlers: ServerSocketHandlers) => {
	const api = useApi()
	const isAppActive = useAppActive()

	// Keep the latest handlers without restarting the socket when they change
	const handlersRef = useRef(handlers)
	handlersRef.current = handlers

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
			handlersRef.current.onDisconnect()

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
				handlersRef.current.onConnect()
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
}

export default useServerSocket
