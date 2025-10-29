import { Api } from '@jellyfin/sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useJellifyContext } from '../../../providers'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'

type SocketState = 'open' | 'closed'

/**
 *
 * @returns
 */
const useWebSocket: (networkStatus: networkStatusTypes) => SocketState = (networkStatus) => {
	const { api } = useJellifyContext()

	const [socketState, setSocketState] = useState<SocketState>('open')

	const onOpen = useCallback(() => {
		consoleOut(`WebSocket`, 'info', `Socket opened`)

		setSocketState('open')
	}, [setSocketState])

	const onClose = useCallback(
		(event: WebSocketCloseEvent) => {
			consoleOut(`WebSocket`, `warn`, `Socket closed: ${event.reason}`)

			setSocketState('closed')
			socket.current.close()

			setTimeout(
				() => (socket.current = createJellyfinWebSocket(api!, onOpen, onClose)),
				10000,
			)
		},
		[setSocketState],
	)

	const socket = useRef<WebSocket>(createJellyfinWebSocket(api!, onOpen, onClose))

	return socketState
}

function consoleOut(
	key: string,
	func: keyof Pick<Console, 'error' | 'info' | 'warn' | 'debug'>,
	message: string,
	error?: Error,
): void {
	if (func === 'error') console[func](`**${key}**: ${message}`, error)
	else console[func](`**${key}**: ${message}`)
}

function createJellyfinWebSocket(
	api: Api,
	onOpen: () => void,
	onClose: (event: WebSocketCloseEvent) => void,
): WebSocket {
	const url = new URL(`${api.basePath}`)

	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

	url.pathname = 'socket'
	url.searchParams.append(`api_key`, api.accessToken)

	consoleOut(`Websocket`, 'debug', `Building websocket with ${url.protocol.toUpperCase()}`)

	const websocket = new WebSocket(url.toString(), url.protocol)

	websocket.onopen = onOpen

	websocket.onclose = onClose

	return websocket
}

export default useWebSocket
