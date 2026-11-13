import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../../constants/storage'
import { SwipeActionType, SwipeSettingsStore } from './types'
import { setLeft, setRight, toggleLeft, toggleRight } from './utils/set'

export type { SwipeActionType } from './types'

const DEFAULT_LEFT: SwipeActionType[] = ['ToggleFavorite', 'AddToPlaylist']
const DEFAULT_RIGHT: SwipeActionType[] = ['AddToQueue']

export const useSwipeSettingsStore = create<SwipeSettingsStore>()(
	devtools(
		persist(
			(set, get) => ({
				left: DEFAULT_LEFT,
				right: DEFAULT_RIGHT,
				setLeft: setLeft(set),
				setRight: setRight(set),
				toggleLeft: toggleLeft(set, get),
				toggleRight: toggleRight(set, get),
			}),
			{
				name: 'swipe-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useLeftSwipeActions = (): [
	SwipeActionType[],
	(actions: SwipeActionType[]) => void,
] => {
	const left = useSwipeSettingsStore((s) => s.left)
	const setLeft = useSwipeSettingsStore((s) => s.setLeft)
	return [left, setLeft]
}

export const useRightSwipeActions = (): [
	SwipeActionType[],
	(actions: SwipeActionType[]) => void,
] => {
	const right = useSwipeSettingsStore((s) => s.right)
	const setRight = useSwipeSettingsStore((s) => s.setRight)
	return [right, setRight]
}
