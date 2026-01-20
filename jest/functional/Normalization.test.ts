import JellifyTrack from '../../src/types/JellifyTrack'
import calculateTrackVolume from '../../src/hooks/player/functions/normalization'

describe('Normalization Module', () => {
	it('should calculate the volume for a track with a normalization gain of 6', () => {
		const track: JellifyTrack = {
			url: 'https://example.com/track.mp3',
			item: {
				NormalizationGain: 6, // 6 Gain means the track is quieter than the target volume
			},
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBe(1) // This module will cap the volume at 1 to prevent clipping
	})

	it('should calculate the volume for a track with a normalization gain of 0', () => {
		const track: JellifyTrack = {
			url: 'https://example.com/track.mp3',
			item: {
				NormalizationGain: 0, // 0 Gain means the track is at the target volume
			},
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBe(1) // No normalization gain means the track is at the target volume
	})

	it('should calculate the volume for a track with a normalization gain of -10', () => {
		const track: JellifyTrack = {
			url: 'https://example.com/track.mp3',
			item: {
				NormalizationGain: -10, // -10 Gain means the track is louder than the target volume
			},
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
		}

		const volume = calculateTrackVolume(track)

		expect(volume).toBeLessThan(0.5) // This module will cap the volume at 1 to prevent clipping
	})
})
