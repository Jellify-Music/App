import { useNetworkStore } from '.'

export const setNetworkStatus = useNetworkStore.getState().setNetworkStatus

export const setSocketConnection = useNetworkStore.getState().setSocketConnection
