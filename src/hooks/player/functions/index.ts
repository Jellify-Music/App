import { usePlayerQueueStore } from '../../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'

export function handleActiveTrackChanged(
	activeTrack: TrackItem | undefined,
	activeIndex: number | undefined,
): void {
	usePlayerQueueStore.getState().setCurrentTrack(activeTrack)
	usePlayerQueueStore.getState().setCurrentIndex(activeIndex)
}
