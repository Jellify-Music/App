import { Queue } from '@/src/services/types/queue-item'
import { RepeatMode, TrackItem } from 'react-native-nitro-player'
import { StateCreator } from 'zustand'

type PlayerQueueStoreMutators = [['zustand/devtools', never], ['zustand/persist', unknown]]

type PlayerQueueStoreCreator = StateCreator<PlayerQueueStore, PlayerQueueStoreMutators>

export type PlayerQueueStoreSet = Parameters<PlayerQueueStoreCreator>[0]

export type ReplaceQueueParams = {
	queue: TrackItem[]
	unShuffledQueue: TrackItem[]
	queueRef: Queue
	index: number
	shuffled: boolean
}

export type PlayerQueueStore = {
	shuffled: boolean
	setShuffled: (shuffled: boolean) => void

	repeatMode: RepeatMode
	setRepeatMode: (repeatMode: RepeatMode) => void

	queueRef: Queue | undefined
	setQueueRef: (queueRef: Queue | undefined) => void

	unShuffledQueue: TrackItem[]
	setUnshuffledQueue: (unShuffledQueue: TrackItem[]) => void

	queue: TrackItem[]
	/** Also replaces the unshuffled queue when one is given */
	setQueue: (queue: TrackItem[], unShuffledQueue?: TrackItem[]) => void

	currentIndex: number | undefined
	setCurrentIndex: (index: number | undefined) => void

	/** Replaces the player's playlist and the store's queue, then loads it at `index` */
	replaceQueue: (params: ReplaceQueueParams) => Promise<void>
}
