import { StateCreator } from 'zustand'

export type SwipeActionType = 'AddToQueue' | 'ToggleFavorite' | 'AddToPlaylist' | 'PlayNext'

export type SwipeSettingsStore = {
	left: SwipeActionType[] // actions when swiping LEFT on a track row
	right: SwipeActionType[] // actions when swiping RIGHT on a track row

	setLeft: (actions: SwipeActionType[]) => void
	setRight: (actions: SwipeActionType[]) => void
	toggleLeft: (action: SwipeActionType) => void
	toggleRight: (action: SwipeActionType) => void
}

type SwipeSettingsStoreMutators = [['zustand/devtools', never], ['zustand/persist', unknown]]

type SwipeSettingsStoreCreator = StateCreator<SwipeSettingsStore, SwipeSettingsStoreMutators>

export type SwipeSettingsStoreSet = Parameters<SwipeSettingsStoreCreator>[0]

export type SwipeSettingsStoreGet = Parameters<SwipeSettingsStoreCreator>[1]
