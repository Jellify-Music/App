import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import SocketConnection from '../../enums/network/socket-connection'
import NetworkStatus from '../../enums/network'
import { onlineManager } from '@tanstack/react-query'

type NetworkStore = {
	networkStatus: NetworkStatus | null
	setNetworkStatus: (status: NetworkStatus | null) => void

	socketConnection: SocketConnection
	setSocketConnection: (socketConnection: SocketConnection) => void
}

export const useNetworkStore = create<NetworkStore>()(
	devtools(
		(set) => ({
			networkStatus: null,
			setNetworkStatus: (networkStatus) => set({ networkStatus }),

			socketConnection: SocketConnection.Disconnected,
			setSocketConnection: (socketConnection) => {
				set({ socketConnection })

				if (socketConnection === SocketConnection.Connected) onlineManager.setOnline(true)
				else if (socketConnection === SocketConnection.Disconnected)
					onlineManager.setOnline(false)
			},
		}),
		{
			name: 'network-store',
		},
	),
)

export const useIsConnectionActive = () => {
	const { networkStatus, socketConnection } = useNetworkStore()

	return (
		networkStatus === NetworkStatus.CONNECTED && socketConnection === SocketConnection.Connected
	)
}

export const useNetworkStatus = (): [
	NetworkStatus | null,
	(status: NetworkStatus | null) => void,
] => {
	const networkStatus = useNetworkStore((state) => state.networkStatus)
	const setNetworkStatus = useNetworkStore((state) => state.setNetworkStatus)

	return [networkStatus, setNetworkStatus]
}
