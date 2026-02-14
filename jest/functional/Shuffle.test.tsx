import 'react-native'
import { shuffleJellifyTracks } from '../../src/hooks/player/functions/utils/shuffle'
import { TrackItem } from 'react-native-nitro-player'

// Test the shuffle utility function directly
describe('Shuffle Utility Function', () => {
	const createMockTracks = (count: number): TrackItem[] => {
		return Array.from({ length: count }, (_, i) => ({
			url: `https://example.com/${i + 1}`,
			id: `track-${i + 1}`,
			title: `Track ${i + 1}`,
			artist: `Artist ${i + 1}`,
			album: `Album ${i + 1}`,
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
			extraPayload: {
				item: JSON.stringify({
					Id: `${i + 1}`,
					Name: `Track ${i + 1}`,
					Artists: [`Artist ${i + 1}`],
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
		}))
	}

	test('should shuffle tracks correctly', () => {
		const tracks = createMockTracks(5)
		const result = shuffleJellifyTracks(tracks)

		expect(result.shuffled).toHaveLength(5)
		expect(result.original).toEqual(tracks)

		// Verify all tracks are still present (just reordered)
		const originalIds = tracks.map((t) => t.id).sort()
		const shuffledIds = result.shuffled.map((t) => t.id).sort()
		expect(shuffledIds).toEqual(originalIds)
	})

	test('should handle manually queued tracks correctly', () => {
		const tracks = createMockTracks(3)

		const result = shuffleJellifyTracks(tracks)

		expect(result.shuffled).toHaveLength(2) // Only non-manually queued tracks
	})

	test('should handle empty array', () => {
		const result = shuffleJellifyTracks([])

		expect(result.shuffled).toHaveLength(0)
		expect(result.original).toHaveLength(0)
	})
})
