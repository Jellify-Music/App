enum SocketConnection {
	Disconnected = WebSocket.CLOSED,
	Disconnecting = WebSocket.CLOSING,
	Connected = WebSocket.OPEN,
	Connecting = WebSocket.CONNECTING,
}

export default SocketConnection
