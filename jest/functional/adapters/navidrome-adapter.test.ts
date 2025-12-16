/**
 * Unit tests for NavidromeAdapter class
 */

// Mock react-native-nitro-fetch before importing the adapter
jest.mock('react-native-nitro-fetch', () => ({
	nitroFetchOnWorklet: jest.fn(),
}))

import { NavidromeAdapter } from '../../../src/api/adapters/navidrome-adapter'
import { UnifiedTrack, StreamOptions } from '../../../src/api/core/types'
import { QueuingType } from '../../../src/enums/queuing-type'

describe('NavidromeAdapter', () => {
	const serverUrl = 'https://navidrome.example.com'
	const username = 'testuser'
	const password = 'testpassword'

	let adapter: NavidromeAdapter

	beforeEach(() => {
		adapter = new NavidromeAdapter(serverUrl, username, password)
	})

	describe('constructor', () => {
		it('should create an adapter without errors', () => {
			expect(adapter).toBeDefined()
		})
	})

	describe('getStreamUrl', () => {
		it('should return a properly formatted stream URL', () => {
			const streamUrl = adapter.getStreamUrl('track-123')

			expect(streamUrl).toContain('/rest/stream.view')
			expect(streamUrl).toContain('id=track-123')
			expect(streamUrl).toContain(`u=${username}`)
			expect(streamUrl).toContain('p=enc%3A') // Hex-encoded password (: is URL-encoded as %3A)
			expect(streamUrl).toContain('v=1.16.1')
			expect(streamUrl).toContain('c=jellify')
			expect(streamUrl).toContain('f=json')
		})

		it('should include maxBitRate when specified in options', () => {
			const options: StreamOptions = { maxBitrate: 320 }
			const streamUrl = adapter.getStreamUrl('track-123', options)

			expect(streamUrl).toContain('maxBitRate=320')
		})

		it('should include format when specified in options', () => {
			const options: StreamOptions = { format: 'opus' }
			const streamUrl = adapter.getStreamUrl('track-123', options)

			expect(streamUrl).toContain('format=opus')
		})
	})

	describe('getCoverArtUrl', () => {
		it('should return a properly formatted cover art URL', () => {
			const coverArtUrl = adapter.getCoverArtUrl('album-456')

			expect(coverArtUrl).toContain('/rest/getCoverArt.view')
			expect(coverArtUrl).toContain('id=album-456')
			expect(coverArtUrl).toContain(`u=${username}`)
		})

		it('should include size when specified', () => {
			const coverArtUrl = adapter.getCoverArtUrl('album-456', 500)

			expect(coverArtUrl).toContain('size=500')
		})
	})

	describe('getDownloadUrl', () => {
		it('should return a properly formatted download URL', () => {
			const downloadUrl = adapter.getDownloadUrl('track-123')

			expect(downloadUrl).toContain('/rest/download.view')
			expect(downloadUrl).toContain('id=track-123')
			expect(downloadUrl).toContain(`u=${username}`)
		})
	})

	describe('mapToJellifyTrack', () => {
		it('should map a UnifiedTrack to JellifyTrack', () => {
			const unifiedTrack: UnifiedTrack = {
				id: 'track-123',
				name: 'Test Song',
				albumId: 'album-456',
				albumName: 'Test Album',
				artistId: 'artist-789',
				artistName: 'Test Artist',
				duration: 180,
				trackNumber: 3,
				discNumber: 1,
				coverArtId: 'cover-abc',
			}

			const result = adapter.mapToJellifyTrack(unifiedTrack, QueuingType.FromSelection)

			expect(result.title).toBe('Test Song')
			expect(result.album).toBe('Test Album')
			expect(result.artist).toBe('Test Artist')
			expect(result.duration).toBe(180)
			expect(result.backend).toBe('navidrome')
			expect(result.sessionId).toBeNull() // Navidrome doesn't use session IDs
			expect(result.sourceType).toBe('stream')
			expect(result.QueuingType).toBe(QueuingType.FromSelection)
			expect(result.url).toContain('/rest/stream.view')
			expect(result.artwork).toContain('/rest/getCoverArt.view')
		})

		it('should handle track without cover art', () => {
			const trackWithoutCover: UnifiedTrack = {
				id: 'track-no-cover',
				name: 'No Cover Song',
				albumId: 'album-id',
				albumName: 'Album',
				artistId: 'artist-id',
				artistName: 'Artist',
				duration: 120,
			}

			const result = adapter.mapToJellifyTrack(trackWithoutCover)

			expect(result.artwork).toBeUndefined()
		})

		it('should include item with BaseItemDto-compatible structure', () => {
			const track: UnifiedTrack = {
				id: 'track-1',
				name: 'Song',
				albumId: 'album-1',
				albumName: 'Album',
				artistId: 'artist-1',
				artistName: 'Artist',
				duration: 100,
				normalizationGain: -5.5,
			}

			const result = adapter.mapToJellifyTrack(track)

			expect(result.item.Id).toBe('track-1')
			expect(result.item.Name).toBe('Song')
			expect(result.item.AlbumId).toBe('album-1')
			expect(result.item.NormalizationGain).toBe(-5.5)
			expect(result.item.RunTimeTicks).toBe(100 * 10_000_000)
		})
	})

	describe('reportPlaybackStart', () => {
		it('should resolve without error (no-op for Navidrome)', async () => {
			await expect(adapter.reportPlaybackStart('track-123')).resolves.toBeUndefined()
		})
	})

	describe('reportPlaybackProgress', () => {
		it('should resolve without error (no-op for Navidrome)', async () => {
			await expect(adapter.reportPlaybackProgress('track-123', 60)).resolves.toBeUndefined()
		})
	})

	describe('URL encoding', () => {
		it('should properly hex-encode password in URLs', () => {
			const adapterWithSpecialChars = new NavidromeAdapter(serverUrl, 'user', 'p@ss!w0rd')

			const streamUrl = adapterWithSpecialChars.getStreamUrl('track-1')

			// Should contain hex-encoded password
			expect(streamUrl).toContain('p=enc%3A') // Hex-encoded password (: is URL-encoded)
			// Should NOT contain raw special characters
			expect(streamUrl).not.toContain('@')
			expect(streamUrl).not.toContain('!')
		})
	})
})
