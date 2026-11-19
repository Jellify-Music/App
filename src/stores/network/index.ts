import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { NetworkStatuses } from '../../enums/network-status'
import { useTranslation } from 'react-i18next'

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

	const { t } = useTranslation()

	const statusDisplayText =
		networkStatus === NetworkStatuses.ONLINE ? t('network.backOnline') : t('network.offline')

	return [networkStatus, setNetworkStatus, statusDisplayText]
}
