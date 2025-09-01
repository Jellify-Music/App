import { Api } from '@jellyfin/sdk'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useJellifyContext } from '../../../providers'
import { useNetworkStatus } from '../../../stores/network/connectivity'

type SocketState = 'open' | 'closed'

/**
 *
 * @returns
 */
const useWebSocket: () => RefObject<SocketState | undefined> = () => {
	const networkStatus = useNetworkStatus()
	const { api } = useJellifyContext()

	const prevSocketState = useRef<SocketState>('closed')
	const socketState = useRef<SocketState>('closed')

	const onOpen = useCallback(() => {
		consoleOut(`WebSocket`, 'info', `Socket opened`)

		prevSocketState.current = socketState.current
		socketState.current = 'open'
	}, [socketState])

	const onClose = useCallback(
		(event: WebSocketCloseEvent) => {
			consoleOut(`WebSocket`, `warn`, `Socket closed: ${event.reason}`)

			prevSocketState.current = socketState.current
			socketState.current = 'closed'
		},
		[socketState],
	)

	useEffect(() => {
		if (socketState.current === 'closed') createJellyfinWebSocket(api!, onOpen, onClose)
	}, [socketState.current, networkStatus])

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
