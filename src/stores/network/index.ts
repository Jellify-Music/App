import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { NetworkStatusMessages } from '../../configs/messaging/network-status'
import { NetworkStatuses } from '../../enums/network-status'

type NetworkStore = {
	networkStatus: NetworkStatuses | null
	setNetworkStatus: (status: NetworkStatuses | null) => void
}

export const useNetworkStore = create<NetworkStore>()(
	devtools(
		(set) => ({
			networkStatus: null,
			setNetworkStatus: (networkStatus) => set({ networkStatus }),
		}),
		{
			name: 'network-store',
		},
	),
)

export const useNetworkStatus = (): [
	NetworkStatuses | null,
	(status: NetworkStatuses | null) => void,
	string,
] => {
	const networkStatus = useNetworkStore((state) => state.networkStatus)
	const setNetworkStatus = useNetworkStore((state) => state.setNetworkStatus)

	const statusDisplayText =
		networkStatus === NetworkStatuses.ONLINE
			? NetworkStatusMessages.BACK_ONLINE
			: NetworkStatusMessages.NO_INTERNET

	return [networkStatus, setNetworkStatus, statusDisplayText]
}
