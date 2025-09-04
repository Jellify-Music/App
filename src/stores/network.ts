import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { networkStatusTypes } from '../components/Network/internetConnectionWatcher'

type NetworkStore = {
	networkStatus: networkStatusTypes | null
	setNetworkStatus: (status: networkStatusTypes | null) => void
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
	networkStatusTypes | null,
	(status: networkStatusTypes | null) => void,
] => {
	const networkStatus = useNetworkStore((state) => state.networkStatus)
	const setNetworkStatus = useNetworkStore((state) => state.setNetworkStatus)

	return [networkStatus, setNetworkStatus]
}
