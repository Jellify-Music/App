import { QueuingType } from '../../../../enums/queuing-type'
import JellifyTrack from '../../../../types/JellifyTrack'
import { fetchManuallyQueuedTracks } from './queue'

export function shuffleJellifyTracks(tracks: JellifyTrack[]): {
	shuffled: JellifyTrack[]
	manuallyQueued: JellifyTrack[]
	original: JellifyTrack[]
} {
	// Make a copy to avoid mutating the original array, filtering out manually queued tracks
	const shuffled = [...tracks.filter((track) => track.QueuingType === QueuingType.FromSelection)]

	const manuallyQueued = fetchManuallyQueuedTracks(tracks)

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}

	return { shuffled, manuallyQueued, original: tracks }
}
