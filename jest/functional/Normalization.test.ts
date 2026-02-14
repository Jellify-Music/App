import { TrackItem } from 'react-native-nitro-player'
import calculateTrackVolume from '../../src/utils/audio/normalization'

describe('Normalization Module', () => {
	it('should calculate the volume for a track with a normalization gain of 6', () => {
		const track: TrackItem = {
			id: 'test-track-1',
			title: 'Test Track 1',
			artist: 'Test Artist',
			album: 'Test Album',
			url: 'https://example.com/track.mp3',
			extraPayload: {
				item: JSON.stringify({
					NormalizationGain: 6, // 6 Gain means the track is quieter than the target volume
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
			duration: 420,
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBe(1) // This module will cap the volume at 1 to prevent clipping
	})

	it('should calculate the volume for a track with a normalization gain of 0', () => {
		const track: TrackItem = {
			id: 'test-track-2',
			title: 'Test Track 2',
			artist: 'Test Artist',
			album: 'Test Album',
			url: 'https://example.com/track.mp3',
			extraPayload: {
				item: JSON.stringify({
					NormalizationGain: 0, // 0 Gain means the track is at the target volume
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
			duration: 420,
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBe(1) // No normalization gain means the track is at the target volume
	})

	it('should calculate the volume for a track with a normalization gain of -10', () => {
		const track: TrackItem = {
			id: 'test-track-3',
			title: 'Test Track 3',
			artist: 'Test Artist',
			album: 'Test Album',
			url: 'https://example.com/track.mp3',
			extraPayload: {
				item: JSON.stringify({
					NormalizationGain: -10, // -10 Gain means the track is louder than the target volume
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
			duration: 420,
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBeLessThan(0.5) // This module will cap the volume at 1 to prevent clipping
	})
})
