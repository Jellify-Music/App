import { TrackItem } from 'react-native-nitro-player'

export function shuffleJellifyTracks(tracks: TrackItem[]): {
	shuffled: TrackItem[]
	original: TrackItem[]
} {
	// Make a copy to avoid mutating the original array, filtering out manually queued tracks
	const shuffled = [...tracks]

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}

	return { shuffled, original: tracks }
}
