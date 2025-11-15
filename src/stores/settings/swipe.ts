import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../constants/storage'

export type SwipeActionType = 'AddToQueue' | 'ToggleFavorite' | 'AddToPlaylist'

type SwipeSettingsStore = {
	left: SwipeActionType[] // actions when swiping LEFT on a track row
	right: SwipeActionType[] // actions when swiping RIGHT on a track row

	setLeft: (actions: SwipeActionType[]) => void
	setRight: (actions: SwipeActionType[]) => void
	toggleLeft: (action: SwipeActionType) => void
	toggleRight: (action: SwipeActionType) => void
}

const DEFAULT_LEFT: SwipeActionType[] = ['ToggleFavorite', 'AddToPlaylist']
const DEFAULT_RIGHT: SwipeActionType[] = ['AddToQueue']

export const useSwipeSettingsStore = create<SwipeSettingsStore>()(
	devtools(
		persist(
			(set, get) => ({
				left: DEFAULT_LEFT,
				right: DEFAULT_RIGHT,
				setLeft: (actions) => set({ left: actions }),
				setRight: (actions) => set({ right: actions }),
				toggleLeft: (action) => {
					const cur = get().left
					set({
						left: cur.includes(action)
							? cur.filter((a) => a !== action)
							: [...cur, action],
					})
				},
				toggleRight: (action) => {
					const cur = get().right
					set({
						right: cur.includes(action)
							? cur.filter((a) => a !== action)
							: [...cur, action],
					})
				},
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
