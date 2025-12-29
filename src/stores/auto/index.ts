import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type AutoStore = {
	isConnected: boolean
	setIsConnected: (connected: boolean) => void
}

export const useAutoStore = create<AutoStore>()(
	devtools((set) => ({
		isConnected: false,
		setIsConnected: (connected: boolean) => set({ isConnected: connected }),
	})),
)

const useAutoIsConnected = () => useAutoStore((state) => state.isConnected)

export default useAutoIsConnected
