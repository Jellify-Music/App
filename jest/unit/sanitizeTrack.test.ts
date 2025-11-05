import { sanitizeTrack, ALLOWED_TRACK_KEYS } from '../../src/providers/Player/utils/sanitizeTrack'

describe('sanitizeTrack', () => {
	it('keeps only RNTP-allowed keys and preserves id', () => {
		const headers: Record<string, string> = { Authorization: 'Bearer token' }
		const fatTrack: Record<string, unknown> = {
			id: 'track-123',
			url: 'https://example.com/audio.mp3',
			title: 'Song Title',
			artist: 'Artist Name',
			album: 'Album Name',
			duration: 245,
			type: 'default',
			headers,
			sourceType: 'stream',
			item: { Id: 'item-1' },
			sessionId: 'session',
		}

		const sanitized = sanitizeTrack(fatTrack)

		expect(sanitized.id).toBe('track-123')
		expect(sanitized.url).toBe('https://example.com/audio.mp3')
		expect(sanitized.headers).toBe(headers)
		expect(Object.keys(sanitized).sort()).toEqual(
			ALLOWED_TRACK_KEYS.filter((key) => fatTrack[key] !== undefined).sort(),
		)
		expect(sanitized).not.toHaveProperty('sourceType')
		expect(sanitized).not.toHaveProperty('item')
		expect(sanitized).not.toHaveProperty('sessionId')
	})

	it('omits optional keys when not provided', () => {
		const lightweight = {
			url: 'file:///track.mp3',
		}

		const sanitized = sanitizeTrack(lightweight)

		expect(sanitized).toEqual({
			url: 'file:///track.mp3',
		})
	})
})
