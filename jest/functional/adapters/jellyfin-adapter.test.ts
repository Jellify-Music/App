/**
 * Unit tests for JellyfinAdapter class
 */

import { JellyfinAdapter } from '../../../src/api/adapters/jellyfin-adapter'
import {
	mapJellyfinTrack,
	mapJellyfinAlbum,
	mapJellyfinArtist,
	mapJellyfinPlaylist,
	getJellyfinStreamUrl,
	getJellyfinCoverArtUrl,
	getJellyfinDownloadUrl,
} from '../../../src/api/adapters/jellyfin-mappings'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import {
	UnifiedTrack,
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedPlaylist,
} from '../../../src/api/core/types'

describe('jellyfin-mappings', () => {
	describe('mapJellyfinTrack', () => {
		it('should map a Jellyfin BaseItemDto (Audio) to UnifiedTrack', () => {
			const jellyfinTrack: BaseItemDto = {
				Id: 'track-123',
				Name: 'Test Song',
				Type: BaseItemKind.Audio,
				AlbumId: 'album-456',
				Album: 'Test Album',
				ArtistItems: [{ Id: 'artist-789', Name: 'Test Artist' }],
				Artists: ['Test Artist'],
				RunTimeTicks: 1800000000, // 3 minutes in ticks
				IndexNumber: 5,
				ParentIndexNumber: 1,
				ProductionYear: 2023,
				Genres: ['Rock', 'Alternative'],
				ImageBlurHashes: {
					Primary: { 'album-456': 'L5Gk~Wof00ay00t7_3j[4nRj' },
				},
				NormalizationGain: -5.5,
			}

			const result = mapJellyfinTrack(jellyfinTrack)

			expect(result.id).toBe('track-123')
			expect(result.name).toBe('Test Song')
			expect(result.albumId).toBe('album-456')
			expect(result.albumName).toBe('Test Album')
			expect(result.artistId).toBe('artist-789')
			expect(result.artistName).toBe('Test Artist')
			expect(result.duration).toBe(180) // Converted from ticks
			expect(result.trackNumber).toBe(5)
			expect(result.discNumber).toBe(1)
			expect(result.year).toBe(2023)
			expect(result.genre).toBe('Rock')
			expect(result.normalizationGain).toBe(-5.5)
		})

		it('should handle track with multiple artists', () => {
			const trackWithMultipleArtists: BaseItemDto = {
				Id: 'track-1',
				Name: 'Collab Song',
				Type: BaseItemKind.Audio,
				AlbumId: 'album-1',
				Album: 'Album',
				Artists: ['Artist 1', 'Artist 2', 'Artist 3'],
				ArtistItems: [
					{ Id: 'a1', Name: 'Artist 1' },
					{ Id: 'a2', Name: 'Artist 2' },
				],
				RunTimeTicks: 1000000000,
			}

			const result = mapJellyfinTrack(trackWithMultipleArtists)

			expect(result.artistName).toBe('Artist 1 • Artist 2 • Artist 3')
			expect(result.artistId).toBe('a1')
		})

		it('should handle missing optional fields', () => {
			const minimalTrack: BaseItemDto = {
				Id: 'track-minimal',
				Name: 'Minimal',
				Type: BaseItemKind.Audio,
				RunTimeTicks: 600000000,
			}

			const result = mapJellyfinTrack(minimalTrack)

			expect(result.id).toBe('track-minimal')
			expect(result.name).toBe('Minimal')
			expect(result.albumId).toBe('')
			expect(result.albumName).toBe('')
			expect(result.artistId).toBe('')
			expect(result.artistName).toBe('')
			expect(result.trackNumber).toBeUndefined()
			expect(result.discNumber).toBeUndefined()
		})
	})

	describe('mapJellyfinAlbum', () => {
		it('should map a Jellyfin BaseItemDto (MusicAlbum) to UnifiedAlbum', () => {
			const jellyfinAlbum: BaseItemDto = {
				Id: 'album-123',
				Name: 'Test Album',
				Type: BaseItemKind.MusicAlbum,
				AlbumArtist: 'Test Artist',
				AlbumArtists: [{ Id: 'artist-456', Name: 'Test Artist' }],
				ProductionYear: 2022,
				Genres: ['Pop'],
				ChildCount: 12,
				RunTimeTicks: 36000000000, // 1 hour
			}

			const result = mapJellyfinAlbum(jellyfinAlbum)

			expect(result.id).toBe('album-123')
			expect(result.name).toBe('Test Album')
			expect(result.artistId).toBe('artist-456')
			expect(result.artistName).toBe('Test Artist')
			expect(result.year).toBe(2022)
			expect(result.genre).toBe('Pop')
			expect(result.trackCount).toBe(12)
			expect(result.duration).toBe(3600) // Converted from ticks
		})
	})

	describe('mapJellyfinArtist', () => {
		it('should map a Jellyfin BaseItemDto (MusicArtist) to UnifiedArtist', () => {
			const jellyfinArtist: BaseItemDto = {
				Id: 'artist-123',
				Name: 'Test Artist',
				Type: BaseItemKind.MusicArtist,
				ChildCount: 5,
				Overview: 'Artist biography goes here',
			}

			const result = mapJellyfinArtist(jellyfinArtist)

			expect(result.id).toBe('artist-123')
			expect(result.name).toBe('Test Artist')
			expect(result.albumCount).toBe(5)
			expect(result.overview).toBe('Artist biography goes here')
		})
	})

	describe('mapJellyfinPlaylist', () => {
		it('should map a Jellyfin BaseItemDto (Playlist) to UnifiedPlaylist', () => {
			const jellyfinPlaylist: BaseItemDto = {
				Id: 'playlist-123',
				Name: 'My Favorites',
				Type: BaseItemKind.Playlist,
				ChildCount: 50,
				RunTimeTicks: 72000000000, // 2 hours
			}

			const result = mapJellyfinPlaylist(jellyfinPlaylist)

			expect(result.id).toBe('playlist-123')
			expect(result.name).toBe('My Favorites')
			expect(result.trackCount).toBe(50)
			expect(result.duration).toBe(7200) // Converted from ticks
		})
	})
})

describe('jellyfin-url-builders', () => {
	const mockApi = {
		basePath: 'https://jellyfin.example.com',
		accessToken: 'test-token-123',
	} as unknown as Api

	describe('getJellyfinStreamUrl', () => {
		it('should build correct stream URL', () => {
			const url = getJellyfinStreamUrl(mockApi, 'track-123')

			expect(url).toBe(
				'https://jellyfin.example.com/Audio/track-123/universal?api_key=test-token-123',
			)
		})
	})

	describe('getJellyfinDownloadUrl', () => {
		it('should build correct download URL', () => {
			const url = getJellyfinDownloadUrl(mockApi, 'track-456')

			expect(url).toBe(
				'https://jellyfin.example.com/Audio/track-456/universal?api_key=test-token-123',
			)
		})
	})
})
