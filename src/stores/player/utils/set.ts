import { PlayerQueueStore, PlayerQueueStoreSet } from '../types'

export const setQueue =
	(set: PlayerQueueStoreSet): PlayerQueueStore['setQueue'] =>
	(queue, unShuffledQueue) =>
		set(unShuffledQueue ? { queue, unShuffledQueue } : { queue })
