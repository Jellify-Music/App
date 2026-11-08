import type { SwipeSettingsStoreGet, SwipeSettingsStoreSet } from '../types'
import { SwipeActionType, SwipeSettingsStore } from '../types'

const toggleAction = (actions: SwipeActionType[], action: SwipeActionType): SwipeActionType[] =>
	actions.includes(action) ? actions.filter((a) => a !== action) : [...actions, action]

export const setLeft =
	(set: SwipeSettingsStoreSet): SwipeSettingsStore['setLeft'] =>
	(actions) =>
		set({ left: actions })

export const setRight =
	(set: SwipeSettingsStoreSet): SwipeSettingsStore['setRight'] =>
	(actions) =>
		set({ right: actions })

export const toggleLeft =
	(set: SwipeSettingsStoreSet, get: SwipeSettingsStoreGet): SwipeSettingsStore['toggleLeft'] =>
	(action) =>
		set({ left: toggleAction(get().left, action) })

export const toggleRight =
	(set: SwipeSettingsStoreSet, get: SwipeSettingsStoreGet): SwipeSettingsStore['toggleRight'] =>
	(action) =>
		set({ right: toggleAction(get().right, action) })
