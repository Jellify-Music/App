import JellifyTrack from '../../../types/JellifyTrack'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export function handleActiveTrackChanged(
	activeTrack: JellifyTrack | undefined,
	activeIndex: number | undefined,
): void {
	usePlayerQueueStore.getState().setCurrentTrack(activeTrack as JellifyTrack)
	usePlayerQueueStore.getState().setCurrentIndex(activeIndex)
}
