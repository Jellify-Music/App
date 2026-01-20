import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type PlayerDisplayStore = {
	isPlayerFocused: boolean
	setIsPlayerFocused: (isPlayerFocused: boolean) => void
}

const usePlayerDisplayStore = create<PlayerDisplayStore>()(
	devtools((set) => ({
		isPlayerFocused: false,
		setIsPlayerFocused: (isPlayerFocused) => set({ isPlayerFocused }),
	})),
)

export const useIsPlayerFocused = () => usePlayerDisplayStore((state) => state.isPlayerFocused)

export default usePlayerDisplayStore
