import SocketConnection from '../../enums/network/socket-connection'
import { setNetworkStatus, setSocketConnection } from '../../stores/network/utils'
import { NitroWebSocket, WebSocketMessageEvent } from 'react-native-nitro-websockets'
import { NETWORK_BANNER_ANIMATION_TIMING } from './config'
import { Api } from '@jellyfin/sdk'
import { OutboundWebSocketMessage } from '@jellyfin/sdk/lib/generated-client'

function establishSocketConnection(api: Api) {
	const params = new URLSearchParams()

	params.append('ApiKey', api.accessToken)

	const url = new URL(`${api.basePath.replace(`/http(?=s?://)/`, 'ws')}/socket`)

	url.search = params.toString()

	const socket = new NitroWebSocket(url.toString())

	registerSocketEventHandlers(socket)

	return socket
}

function registerSocketEventHandlers(socket: NitroWebSocket) {
	socket.onopen = onSocketOpen
	socket.onmessage = onSocketMessage
	socket.onerror = onSocketError
}

function reconnectSocket() {}

/**
 * Handles when the {@link NitroWebSocket} connection opens.
 *
 * Handles updating the Zustand store
 */
export function onSocketOpen() {
	setSocketConnection(SocketConnection.Connected)
}

export function onSocketClose() {
	setSocketConnection(SocketConnection.Disconnected)
}

export function onSocketError() {}

export function onSocketMessage({ data }: WebSocketMessageEvent) {
	// Assert the message format
	const message: OutboundWebSocketMessage = JSON.parse(data)

	console.debug(`Received socket message: ${message.MessageType}`)

	// TODO
}

export default establishSocketConnection
