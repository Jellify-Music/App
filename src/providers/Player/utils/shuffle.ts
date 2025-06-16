import JellifyTrack from '../../../types/JellifyTrack'

export function shuffleJellifyTracks(tracks: JellifyTrack[]): {
	shuffled: JellifyTrack[]
	original: JellifyTrack[]
} {
	const shuffled = [...tracks] // Make a copy to avoid mutating the original array

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}

	return { shuffled, original: tracks }
}
