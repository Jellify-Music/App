/**
 * Unit tests for Navidrome type mapping functions
 */

import {
	mapSubsonicTrack,
	mapSubsonicAlbum,
	mapSubsonicArtist,
	mapSubsonicPlaylist,
	mapSubsonicSearchResults,
	mapSubsonicStarred,
} from '../../../src/api/adapters/navidrome-mappings'
import {
	UnifiedTrack,
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedPlaylist,
} from '../../../src/api/core/types'

describe('navidrome-mappings', () => {
	describe('mapSubsonicTrack', () => {
		it('should map a basic subsonic track to UnifiedTrack', () => {
			const subsonicTrack = {
				id: 'track-123',
				title: 'Test Song',
				album: 'Test Album',
				artist: 'Test Artist',
				albumId: 'album-456',
				artistId: 'artist-789',
				duration: 180,
				track: 5,
				discNumber: 1,
				year: 2023,
				genre: 'Rock',
				coverArt: 'cover-abc',
			}

			const result = mapSubsonicTrack(subsonicTrack)

			expect(result.id).toBe('track-123')
			expect(result.name).toBe('Test Song')
			expect(result.albumId).toBe('album-456')
			expect(result.albumName).toBe('Test Album')
			expect(result.artistId).toBe('artist-789')
			expect(result.artistName).toBe('Test Artist')
			expect(result.duration).toBe(180)
			expect(result.trackNumber).toBe(5)
			expect(result.discNumber).toBe(1)
			expect(result.year).toBe(2023)
			expect(result.genre).toBe('Rock')
			expect(result.coverArtId).toBe('cover-abc')
		})

		it('should handle missing optional fields', () => {
			const minimalTrack = {
				id: 'track-minimal',
				title: 'Minimal Track',
				album: 'Album',
				artist: 'Artist',
				albumId: 'album-id',
				artistId: 'artist-id',
				duration: 120,
			}

			const result = mapSubsonicTrack(minimalTrack)

			expect(result.id).toBe('track-minimal')
			expect(result.name).toBe('Minimal Track')
			expect(result.trackNumber).toBeUndefined()
			expect(result.discNumber).toBeUndefined()
			expect(result.year).toBeUndefined()
			expect(result.genre).toBeUndefined()
			// coverArtId falls back to albumId when coverArt is missing
			expect(result.coverArtId).toBe('album-id')
		})

		it('should fallback to empty string when artist is missing', () => {
			const trackWithoutArtist = {
				id: 'track-1',
				title: 'Song',
				album: 'Album Name',
				// artist is undefined
				albumId: 'album-1',
				// artistId is undefined
				duration: 100,
			}

			const result = mapSubsonicTrack(trackWithoutArtist)

			expect(result.artistName).toBe('')
			expect(result.artistId).toBe('')
		})

		it('should use id as coverArtId fallback when both coverArt and albumId are missing', () => {
			const trackMinimal = {
				id: 'track-only-id',
			}

			const result = mapSubsonicTrack(trackMinimal)

			expect(result.coverArtId).toBe('track-only-id')
		})
	})

	describe('mapSubsonicAlbum', () => {
		it('should map a subsonic album to UnifiedAlbum', () => {
			const subsonicAlbum = {
				id: 'album-123',
				name: 'Test Album',
				artist: 'Test Artist',
				artistId: 'artist-456',
				year: 2022,
				genre: 'Pop',
				songCount: 12,
				duration: 3600,
				coverArt: 'cover-xyz',
			}

			const result = mapSubsonicAlbum(subsonicAlbum)

			expect(result.id).toBe('album-123')
			expect(result.name).toBe('Test Album')
			expect(result.artistId).toBe('artist-456')
			expect(result.artistName).toBe('Test Artist')
			expect(result.year).toBe(2022)
			expect(result.genre).toBe('Pop')
			expect(result.trackCount).toBe(12)
			expect(result.duration).toBe(3600)
			expect(result.coverArtId).toBe('cover-xyz')
		})

		it('should handle missing optional fields', () => {
			const minimalAlbum = {
				id: 'album-minimal',
				name: 'Minimal Album',
				artist: 'Artist',
				artistId: 'artist-id',
			}

			const result = mapSubsonicAlbum(minimalAlbum)

			expect(result.id).toBe('album-minimal')
			expect(result.year).toBeUndefined()
			expect(result.genre).toBeUndefined()
			expect(result.trackCount).toBeUndefined()
			// coverArtId falls back to album id
			expect(result.coverArtId).toBe('album-minimal')
		})
	})

	describe('mapSubsonicArtist', () => {
		it('should map a subsonic artist to UnifiedArtist', () => {
			const subsonicArtist = {
				id: 'artist-123',
				name: 'Test Artist',
				albumCount: 5,
				coverArt: 'artist-cover',
			}

			const result = mapSubsonicArtist(subsonicArtist)

			expect(result.id).toBe('artist-123')
			expect(result.name).toBe('Test Artist')
			expect(result.albumCount).toBe(5)
			expect(result.coverArtId).toBe('artist-cover')
		})

		it('should fallback to id when coverArt is missing', () => {
			const artistWithoutCover = {
				id: 'artist-1',
				name: 'Artist',
			}

			const result = mapSubsonicArtist(artistWithoutCover)

			expect(result.coverArtId).toBe('artist-1')
		})
	})

	describe('mapSubsonicPlaylist', () => {
		it('should map a subsonic playlist to UnifiedPlaylist', () => {
			const subsonicPlaylist = {
				id: 'playlist-123',
				name: 'My Playlist',
				songCount: 25,
				duration: 5400,
				public: true,
				owner: 'user1',
				coverArt: 'playlist-cover',
			}

			const result = mapSubsonicPlaylist(subsonicPlaylist)

			expect(result.id).toBe('playlist-123')
			expect(result.name).toBe('My Playlist')
			expect(result.trackCount).toBe(25)
			expect(result.duration).toBe(5400)
			expect(result.isPublic).toBe(true)
			expect(result.ownerName).toBe('user1')
			expect(result.coverArtId).toBe('playlist-cover')
		})

		it('should default trackCount to 0 when songCount is missing', () => {
			const minimalPlaylist = {
				id: 'playlist-1',
				name: 'Empty Playlist',
			}

			const result = mapSubsonicPlaylist(minimalPlaylist)

			expect(result.trackCount).toBe(0)
		})
	})

	describe('mapSubsonicSearchResults', () => {
		it('should map search results into categorized arrays', () => {
			const searchResult = {
				artist: [{ id: 'a1', name: 'Artist 1' }],
				album: [{ id: 'al1', name: 'Album 1', artist: 'Artist', artistId: 'a1' }],
				song: [
					{
						id: 's1',
						title: 'Song 1',
						album: 'Album',
						artist: 'Artist',
						albumId: 'al1',
						artistId: 'a1',
						duration: 100,
					},
				],
			}

			const result = mapSubsonicSearchResults(searchResult)

			expect(result.artists).toHaveLength(1)
			expect(result.albums).toHaveLength(1)
			expect(result.tracks).toHaveLength(1)
			expect(result.playlists).toHaveLength(0) // Subsonic search doesn't include playlists
		})

		it('should handle empty search results', () => {
			const emptyResult = {}

			const result = mapSubsonicSearchResults(emptyResult)

			expect(result.artists).toHaveLength(0)
			expect(result.albums).toHaveLength(0)
			expect(result.tracks).toHaveLength(0)
			expect(result.playlists).toHaveLength(0)
		})
	})

	describe('mapSubsonicStarred', () => {
		it('should map starred content', () => {
			const starred = {
				artist: [{ id: 'a1', name: 'Starred Artist' }],
				album: [{ id: 'al1', name: 'Starred Album', artist: 'Artist', artistId: 'a1' }],
				song: [
					{
						id: 's1',
						title: 'Starred Song',
						album: 'Album',
						artist: 'Artist',
						albumId: 'al1',
						artistId: 'a1',
						duration: 100,
					},
				],
			}

			const result = mapSubsonicStarred(starred)

			expect(result.artists).toHaveLength(1)
			expect(result.albums).toHaveLength(1)
			expect(result.tracks).toHaveLength(1)
		})

		it('should handle empty starred result', () => {
			const emptyStarred = {}

			const result = mapSubsonicStarred(emptyStarred)

			expect(result.artists).toHaveLength(0)
			expect(result.albums).toHaveLength(0)
			expect(result.tracks).toHaveLength(0)
		})
	})
})
