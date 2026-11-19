import { usePlayerQueueStore } from '../../stores/player/queue'

const resetQueue = () => {
	usePlayerQueueStore.getState().setUnshuffledQueue([])
	usePlayerQueueStore.getState().setShuffled(false)
	usePlayerQueueStore.getState().setQueueRef('Recently Played')
	usePlayerQueueStore.getState().setQueue([])
	usePlayerQueueStore.getState().setCurrentIndex(undefined)
}

export default resetQueue
