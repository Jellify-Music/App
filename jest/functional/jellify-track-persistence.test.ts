import {
	toPersistedTrack,
	fromPersistedTrack,
	PersistedJellifyTrack,
} from '../../src/types/JellifyTrack'
import JellifyTrack from '../../src/types/JellifyTrack'
import { QueuingType } from '../../src/enums/queuing-type'

describe('toPersistedTrack', () => {
	it('should strip headers from track', () => {
		const track = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream' as const,
			headers: { 'X-Emby-Token': 'secret-token' },
		} as JellifyTrack & { headers: Record<string, string> }

		const persisted = toPersistedTrack(track)

		// Verify headers are stripped
		expect((persisted as unknown as Record<string, unknown>).headers).toBeUndefined()
		expect(persisted.url).toBe('https://example.com/audio.mp3')
	})

	it('should slim down mediaSourceInfo to essential fields only', () => {
		const track = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream' as const,
			mediaSourceInfo: {
				Id: 'media-source-id',
				Container: 'mp3',
				Bitrate: 320000,
				// These large fields should be stripped:
				Path: '/path/to/file.mp3',
				Size: 10485760,
				TranscodingUrl: '/transcode/long/url/here',
				MediaStreams: [{ Index: 0, Codec: 'mp3' }],
			},
		} as JellifyTrack

		const persisted = toPersistedTrack(track)

		// Only essential fields should remain
		expect(persisted.mediaSourceInfo).toEqual({
			Id: 'media-source-id',
			Container: 'mp3',
			Bitrate: 320000,
		})
	})

	it('should handle undefined mediaSourceInfo', () => {
		const track = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream' as const,
			mediaSourceInfo: undefined,
		} as JellifyTrack

		const persisted = toPersistedTrack(track)

		expect(persisted.mediaSourceInfo).toBeUndefined()
	})

	it('should preserve QueuingType', () => {
		const track = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream' as const,
			QueuingType: QueuingType.PlayingNext,
		} as JellifyTrack

		const persisted = toPersistedTrack(track)

		expect(persisted.QueuingType).toBe(QueuingType.PlayingNext)
	})
})

describe('fromPersistedTrack', () => {
	it('should convert persisted track back to JellifyTrack', () => {
		const persisted: PersistedJellifyTrack = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream',
			QueuingType: QueuingType.FromSelection,
		}

		const track = fromPersistedTrack(persisted)

		expect(track.url).toBe('https://example.com/audio.mp3')
		expect(track.item.Id).toBe('123')
		expect(track.QueuingType).toBe(QueuingType.FromSelection)
	})

	it('should handle slimmed mediaSourceInfo', () => {
		const persisted: PersistedJellifyTrack = {
			url: 'https://example.com/audio.mp3',
			item: { Id: '123', Name: 'Test Track' },
			duration: 180,
			sessionId: 'session-123',
			sourceType: 'stream',
			mediaSourceInfo: {
				Id: 'media-id',
				Container: 'flac',
				Bitrate: 1411000,
			},
		}

		const track = fromPersistedTrack(persisted)

		expect(track.mediaSourceInfo?.Id).toBe('media-id')
		expect(track.mediaSourceInfo?.Container).toBe('flac')
	})
})

describe('round-trip persistence', () => {
	it('should preserve essential data through persist and hydrate cycle', () => {
		const original = {
			url: 'https://example.com/audio.mp3',
			title: 'My Song',
			album: 'My Album',
			artist: 'My Artist',
			duration: 240,
			item: {
				Id: 'track-456',
				Name: 'My Song',
				AlbumId: 'album-789',
				NormalizationGain: -5.2,
			},
			sessionId: 'session-xyz',
			sourceType: 'stream' as const,
			QueuingType: QueuingType.DirectlyQueued,
			mediaSourceInfo: {
				Id: 'source-id',
				Container: 'mp3',
				Bitrate: 320000,
				// Extra fields that should be stripped
				Path: '/some/path',
				Size: 5000000,
			},
		} as JellifyTrack

		const persisted = toPersistedTrack(original)
		const hydrated = fromPersistedTrack(persisted)

		// Essential fields preserved
		expect(hydrated.url).toBe(original.url)
		expect(hydrated.title).toBe(original.title)
		expect(hydrated.album).toBe(original.album)
		expect(hydrated.artist).toBe(original.artist)
		expect(hydrated.duration).toBe(original.duration)
		expect(hydrated.item.Id).toBe(original.item.Id)
		expect(hydrated.item.NormalizationGain).toBe(original.item.NormalizationGain)
		expect(hydrated.QueuingType).toBe(original.QueuingType)

		// Large fields stripped
		expect(
			(hydrated.mediaSourceInfo as unknown as Record<string, unknown> | undefined)?.Path,
		).toBeUndefined()
		expect(
			(hydrated.mediaSourceInfo as unknown as Record<string, unknown> | undefined)?.Size,
		).toBeUndefined()
	})
})
