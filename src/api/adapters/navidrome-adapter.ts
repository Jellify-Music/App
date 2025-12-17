/**
 * Navidrome/Subsonic adapter implementing the MusicServerAdapter interface.
 * Uses NitroFetch for performance with hex-encoded password auth (no crypto required).
 */

import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'
import { MusicServerAdapter } from '../core/adapter'
import {
	AlbumQueryOptions,
	AuthResult,
	SearchOptions,
	StreamOptions,
	TrackQueryOptions,
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedLyrics,
	UnifiedPlaylist,
	UnifiedSearchResults,
	UnifiedStarred,
	UnifiedTrack,
} from '../core/types'
import {
	mapSubsonicAlbum,
	mapSubsonicAlbums,
	mapSubsonicArtist,
	mapSubsonicArtists,
	mapSubsonicPlaylist,
	mapSubsonicPlaylists,
	mapSubsonicSearchResults,
	mapSubsonicStarred,
	mapSubsonicTrack,
	mapSubsonicTracks,
} from './navidrome-mappings'
import JellifyTrack from '../../types/JellifyTrack'
import { QueuingType } from '../../enums/queuing-type'

/**
 * Convert password to hex encoding for Subsonic legacy auth.
 */
function hexEncode(str: string): string {
	return Array.from(str)
		.map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Navidrome/Subsonic implementation using direct fetch with hex-encoded password.
 * This avoids the crypto dependency that subsonic-api requires.
 */
export class NavidromeAdapter implements MusicServerAdapter {
	readonly backend = 'navidrome' as const

	private serverUrl: string
	private username: string
	private password: string

	constructor(serverUrl: string, username: string, password: string) {
		this.serverUrl = serverUrl.replace(/\/+$/, '')
		this.username = username
		this.password = password
	}

	/**
	 * Build URL with auth params for Subsonic API.
	 */
	private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
		const authParams = {
			u: this.username,
			p: `enc:${hexEncode(this.password)}`,
			v: '1.16.1',
			c: 'jellify',
			f: 'json',
			...params,
		}
		const searchParams = new URLSearchParams(authParams)
		return `${this.serverUrl}/rest/${endpoint}?${searchParams.toString()}`
	}

	/**
	 * Make authenticated API request using NitroFetch for background thread JSON parsing.
	 */
	private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
		const url = this.buildUrl(endpoint, params)

		const result = await nitroFetchOnWorklet<T>(
			url,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			},
			(response) => {
				'worklet'
				if (response.status >= 200 && response.status < 300) {
					if (response.bodyString) {
						// Check if the response looks like HTML instead of JSON
						const trimmed = response.bodyString.trim()
						if (trimmed.startsWith('<')) {
							throw new Error(
								`Navidrome server returned HTML instead of JSON. URL: ${url}, Status: ${response.status}, Body starts with: ${trimmed.substring(0, 100)}`,
							)
						}

						let data
						try {
							data = JSON.parse(response.bodyString)
						} catch (parseError) {
							throw new Error(
								`JSON parse error in Navidrome response. Body: ${response.bodyString.substring(0, 200)}`,
							)
						}

						const subsonicResponse = data['subsonic-response']

						if (!subsonicResponse) {
							throw new Error(
								`Invalid Subsonic response - missing 'subsonic-response' key. Body: ${response.bodyString.substring(0, 200)}`,
							)
						}

						if (subsonicResponse.status === 'failed') {
							throw new Error(subsonicResponse.error?.message || 'Subsonic API error')
						}

						return subsonicResponse as T
					}
					throw new Error('Empty response body from Navidrome')
				} else {
					// Log the response body for non-2xx responses
					const bodyPreview = response.bodyString
						? response.bodyString.substring(0, 200)
						: '(empty)'
					throw new Error(
						`Navidrome HTTP error: ${response.status}. Body: ${bodyPreview}`,
					)
				}
			},
		)

		return result
	}

	// =========================================================================
	// Connection & Authentication
	// =========================================================================

	async ping(): Promise<boolean> {
		try {
			await this.request('ping.view')
			return true
		} catch {
			return false
		}
	}

	async authenticate(username: string, password: string): Promise<AuthResult> {
		// Test with new credentials
		const oldUsername = this.username
		const oldPassword = this.password
		this.username = username
		this.password = password

		try {
			await this.request('ping.view')
			return {
				userId: username,
				username: username,
				accessToken: password,
			}
		} catch (error) {
			// Restore old credentials on failure
			this.username = oldUsername
			this.password = oldPassword
			throw error
		}
	}

	// =========================================================================
	// Browsing - Artists
	// =========================================================================

	async getArtists(_libraryId?: string): Promise<UnifiedArtist[]> {
		const response = await this.request<{
			artists?: { index?: Array<{ artist?: unknown[] }> }
		}>('getArtists.view')
		const artists = response.artists?.index?.flatMap((idx) => idx.artist ?? []) ?? []
		return mapSubsonicArtists(artists as Parameters<typeof mapSubsonicArtists>[0])
	}

	async getArtist(id: string): Promise<UnifiedArtist> {
		const response = await this.request<{ artist: unknown }>('getArtist.view', { id })
		return mapSubsonicArtist(response.artist as Parameters<typeof mapSubsonicArtist>[0])
	}

	async getArtistAlbums(artistId: string): Promise<UnifiedAlbum[]> {
		const response = await this.request<{ artist?: { album?: unknown[] } }>('getArtist.view', {
			id: artistId,
		})
		return mapSubsonicAlbums(
			(response.artist?.album ?? []) as Parameters<typeof mapSubsonicAlbums>[0],
		)
	}

	// =========================================================================
	// Browsing - Albums
	// =========================================================================

	async getAlbums(options?: AlbumQueryOptions): Promise<UnifiedAlbum[]> {
		const typeMapping: Record<string, string> = {
			recent: 'recent',
			frequent: 'frequent',
			random: 'random',
			newest: 'newest',
			alphabetical: 'alphabeticalByName',
		}

		const response = await this.request<{ albumList2?: { album?: unknown[] } }>(
			'getAlbumList2.view',
			{
				type: options?.type ? typeMapping[options.type] : 'alphabeticalByName',
				size: String(options?.limit ?? 50),
				offset: String(options?.offset ?? 0),
			},
		)
		return mapSubsonicAlbums(
			(response.albumList2?.album ?? []) as Parameters<typeof mapSubsonicAlbums>[0],
		)
	}

	async getAlbum(id: string): Promise<UnifiedAlbum> {
		const response = await this.request<{ album: unknown }>('getAlbum.view', { id })
		return mapSubsonicAlbum(response.album as Parameters<typeof mapSubsonicAlbum>[0])
	}

	async getAlbumTracks(albumId: string): Promise<UnifiedTrack[]> {
		const response = await this.request<{ album?: { song?: unknown[] } }>('getAlbum.view', {
			id: albumId,
		})
		return mapSubsonicTracks(
			(response.album?.song ?? []) as Parameters<typeof mapSubsonicTracks>[0],
		)
	}

	// =========================================================================
	// Browsing - Tracks
	// =========================================================================

	async getTracks(options?: TrackQueryOptions): Promise<UnifiedTrack[]> {
		if (options?.albumId) {
			return this.getAlbumTracks(options.albumId)
		}
		if (options?.playlistId) {
			return this.getPlaylistTracks(options.playlistId)
		}
		if (options?.artistId) {
			return this.getArtistTracks(options.artistId, options.limit)
		}
		const response = await this.request<{ randomSongs?: { song?: unknown[] } }>(
			'getRandomSongs.view',
			{
				size: String(options?.limit ?? 50),
			},
		)
		return mapSubsonicTracks(
			(response.randomSongs?.song ?? []) as Parameters<typeof mapSubsonicTracks>[0],
		)
	}

	/**
	 * Get all tracks for an artist by fetching their albums and aggregating tracks.
	 */
	async getArtistTracks(artistId: string, limit?: number): Promise<UnifiedTrack[]> {
		// First get all albums for this artist
		const albums = await this.getArtistAlbums(artistId)

		// Then get tracks from each album
		const allTracks: UnifiedTrack[] = []
		for (const album of albums) {
			try {
				const albumTracks = await this.getAlbumTracks(album.id)
				allTracks.push(...albumTracks)
				// If we have a limit and reached it, stop
				if (limit && allTracks.length >= limit) {
					return allTracks.slice(0, limit)
				}
			} catch {
				// Skip albums that fail to load
			}
		}

		return allTracks
	}

	async getTrack(id: string): Promise<UnifiedTrack> {
		const response = await this.request<{ song: unknown }>('getSong.view', { id })
		return mapSubsonicTrack(response.song as Parameters<typeof mapSubsonicTrack>[0])
	}

	// =========================================================================
	// Search
	// =========================================================================

	async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResults> {
		const response = await this.request<{ searchResult3?: unknown }>('search3.view', {
			query: query.trim(),
			artistCount: String(options?.artistLimit ?? 20),
			albumCount: String(options?.albumLimit ?? 20),
			songCount: String(options?.trackLimit ?? 20),
		})
		return mapSubsonicSearchResults(
			(response.searchResult3 ?? {}) as Parameters<typeof mapSubsonicSearchResults>[0],
		)
	}

	// =========================================================================
	// Playlists
	// =========================================================================

	async getPlaylists(): Promise<UnifiedPlaylist[]> {
		const response = await this.request<{ playlists?: { playlist?: unknown[] } }>(
			'getPlaylists.view',
		)
		return mapSubsonicPlaylists(
			(response.playlists?.playlist ?? []) as Parameters<typeof mapSubsonicPlaylists>[0],
		)
	}

	async getPlaylistTracks(playlistId: string): Promise<UnifiedTrack[]> {
		const response = await this.request<{ playlist?: { entry?: unknown[] } }>(
			'getPlaylist.view',
			{ id: playlistId },
		)
		return mapSubsonicTracks(
			(response.playlist?.entry ?? []) as Parameters<typeof mapSubsonicTracks>[0],
		)
	}

	async createPlaylist(name: string, trackIds?: string[]): Promise<UnifiedPlaylist> {
		const params: Record<string, string> = { name }
		if (trackIds?.length) {
			// Subsonic uses multiple songId params
			const url = this.buildUrl('createPlaylist.view', params)
			const songParams = trackIds.map((id) => `songId=${id}`).join('&')
			const fullUrl = `${url}&${songParams}`

			const data = await nitroFetchOnWorklet<{ playlist: unknown }>(
				fullUrl,
				{ method: 'GET', headers: { 'Content-Type': 'application/json' } },
				(response) => {
					'worklet'
					if (response.status >= 200 && response.status < 300 && response.bodyString) {
						const parsed = JSON.parse(response.bodyString)
						return parsed['subsonic-response'] as { playlist: unknown }
					}
					throw new Error(`HTTP ${response.status}`)
				},
			)

			return mapSubsonicPlaylist(data?.playlist as Parameters<typeof mapSubsonicPlaylist>[0])
		}
		const response = await this.request<{ playlist: unknown }>('createPlaylist.view', params)
		return mapSubsonicPlaylist(response.playlist as Parameters<typeof mapSubsonicPlaylist>[0])
	}

	async updatePlaylist(
		id: string,
		updates: {
			name?: string
			trackIdsToAdd?: string[]
			trackIndicesToRemove?: number[]
		},
	): Promise<void> {
		const params: Record<string, string> = { playlistId: id }
		if (updates.name) params.name = updates.name

		let url = this.buildUrl('updatePlaylist.view', params)

		if (updates.trackIdsToAdd?.length) {
			url += '&' + updates.trackIdsToAdd.map((id) => `songIdToAdd=${id}`).join('&')
		}
		if (updates.trackIndicesToRemove?.length) {
			url +=
				'&' +
				updates.trackIndicesToRemove.map((idx) => `songIndexToRemove=${idx}`).join('&')
		}

		await nitroFetchOnWorklet(
			url,
			{ method: 'GET', headers: { 'Content-Type': 'application/json' } },
			(response) => {
				'worklet'
				if (response.status >= 200 && response.status < 300) {
					return undefined
				}
				throw new Error(`HTTP ${response.status}`)
			},
		)
	}

	async deletePlaylist(id: string): Promise<void> {
		await this.request('deletePlaylist.view', { id })
	}

	// =========================================================================
	// Favorites
	// =========================================================================

	async star(id: string): Promise<void> {
		await this.request('star.view', { id })
	}

	async unstar(id: string): Promise<void> {
		await this.request('unstar.view', { id })
	}

	async getStarred(): Promise<UnifiedStarred> {
		const response = await this.request<{ starred2?: unknown }>('getStarred2.view')
		return mapSubsonicStarred(
			(response.starred2 ?? {}) as Parameters<typeof mapSubsonicStarred>[0],
		)
	}

	// =========================================================================
	// Playback & Streaming
	// =========================================================================

	getStreamUrl(trackId: string, options?: StreamOptions): string {
		const params: Record<string, string> = { id: trackId }
		if (options?.maxBitrate) params.maxBitRate = String(options.maxBitrate)
		if (options?.format) params.format = options.format
		return this.buildUrl('stream.view', params)
	}

	getCoverArtUrl(id: string, size?: number): string {
		const params: Record<string, string> = { id }
		if (size) params.size = String(size)
		return this.buildUrl('getCoverArt.view', params)
	}
	getDownloadUrl(trackId: string): string {
		return this.buildUrl('download.view', { id: trackId })
	}

	mapToJellifyTrack(
		track: UnifiedTrack,
		queuingType?: QueuingType,
		streamOptions?: StreamOptions,
	): JellifyTrack {
		const streamUrl = this.getStreamUrl(track.id, streamOptions)
		const coverArtUrl = track.coverArtId
			? this.getCoverArtUrl(track.coverArtId, 500)
			: undefined

		return {
			url: streamUrl,
			title: track.name,
			album: track.albumName,
			artist: track.artistName,
			artwork: coverArtUrl,
			duration: track.duration,
			// Create a slimified BaseItemDto-compatible object for compatibility
			item: {
				Id: track.id,
				Name: track.name,
				AlbumId: track.albumId,
				ArtistItems: track.artistId
					? [{ Id: track.artistId, Name: track.artistName }]
					: undefined,
				NormalizationGain: track.normalizationGain,
				RunTimeTicks: track.duration * 10_000_000, // Convert seconds to ticks
			},
			backend: 'navidrome',
			sessionId: null, // Navidrome doesn't use session IDs
			sourceType: 'stream',
			QueuingType: queuingType,
			// Store stream options for quality badge display
			navidromeStreamOptions: streamOptions,
			// No headers needed - auth is in the URL
		} as JellifyTrack
	}

	async reportPlaybackStart(_trackId: string): Promise<void> {
		// Subsonic doesn't have a playback start API
	}

	async reportPlaybackProgress(_trackId: string, _position: number): Promise<void> {
		// Subsonic doesn't have a progress API
	}

	async reportPlaybackEnd(trackId: string, _position: number, completed: boolean): Promise<void> {
		if (completed) {
			await this.request('scrobble.view', { id: trackId, submission: 'true' })
		}
	}

	// =========================================================================
	// Optional Features
	// =========================================================================

	async getInstantMix(seedId: string, limit?: number): Promise<UnifiedTrack[]> {
		const response = await this.request<{ similarSongs2?: { song?: unknown[] } }>(
			'getSimilarSongs2.view',
			{
				id: seedId,
				count: String(limit ?? 50),
			},
		)
		return mapSubsonicTracks(
			(response.similarSongs2?.song ?? []) as Parameters<typeof mapSubsonicTracks>[0],
		)
	}

	async getSimilarArtists(artistId: string): Promise<UnifiedArtist[]> {
		const response = await this.request<{ artistInfo2?: { similarArtist?: unknown[] } }>(
			'getArtistInfo2.view',
			{ id: artistId },
		)
		return mapSubsonicArtists(
			(response.artistInfo2?.similarArtist ?? []) as Parameters<typeof mapSubsonicArtists>[0],
		)
	}

	async getLyrics(trackId: string): Promise<UnifiedLyrics | null> {
		try {
			const song = await this.getTrack(trackId)
			const response = await this.request<{ lyrics?: { value?: string } }>('getLyrics.view', {
				artist: song.artistName,
				title: song.name,
			})

			if (!response.lyrics?.value) return null

			return { text: response.lyrics.value }
		} catch {
			return null
		}
	}

	async getArtistInfo(artistId: string): Promise<{
		biography?: string
		musicBrainzId?: string
		lastFmUrl?: string
		similarArtists?: UnifiedArtist[]
	}> {
		const response = await this.request<{
			artistInfo2?: {
				biography?: string
				musicBrainzId?: string
				lastFmUrl?: string
				similarArtist?: unknown[]
			}
		}>('getArtistInfo2.view', { id: artistId })

		const info = response.artistInfo2

		return {
			biography: info?.biography,
			musicBrainzId: info?.musicBrainzId,
			lastFmUrl: info?.lastFmUrl,
			similarArtists: mapSubsonicArtists(
				(info?.similarArtist ?? []) as Parameters<typeof mapSubsonicArtists>[0],
			),
		}
	}

	// =========================================================================
	// Home Content (Subsonic getAlbumList2 variants)
	// =========================================================================

	async getRecentTracks(limit: number = 50): Promise<UnifiedTrack[]> {
		// Subsonic: Get recent albums first, then fetch tracks from them
		const response = await this.request<{
			albumList2?: { album?: unknown[] }
		}>('getAlbumList2.view', { type: 'recent', size: String(Math.ceil(limit / 10)) })

		const albums = (response.albumList2?.album ?? []) as Array<{ id: string }>
		const tracks: UnifiedTrack[] = []

		for (const album of albums) {
			if (tracks.length >= limit) break
			try {
				const albumTracks = await this.getAlbumTracks(album.id)
				tracks.push(...albumTracks.slice(0, limit - tracks.length))
			} catch {
				// Skip albums that fail to load
			}
		}

		return tracks
	}

	async getFrequentTracks(limit: number = 50): Promise<UnifiedTrack[]> {
		// Subsonic: Get frequent/top songs if available, otherwise frequent albums
		const response = await this.request<{
			albumList2?: { album?: unknown[] }
		}>('getAlbumList2.view', { type: 'frequent', size: String(Math.ceil(limit / 10)) })

		const albums = (response.albumList2?.album ?? []) as Array<{ id: string }>
		const tracks: UnifiedTrack[] = []

		for (const album of albums) {
			if (tracks.length >= limit) break
			try {
				const albumTracks = await this.getAlbumTracks(album.id)
				tracks.push(...albumTracks.slice(0, limit - tracks.length))
			} catch {
				// Skip albums that fail to load
			}
		}

		return tracks
	}

	async getRecentArtists(limit: number = 20): Promise<UnifiedArtist[]> {
		// Get recent albums and extract unique artists
		const response = await this.request<{
			albumList2?: { album?: unknown[] }
		}>('getAlbumList2.view', { type: 'recent', size: String(limit * 2) })

		const albums = (response.albumList2?.album ?? []) as Array<{
			artistId?: string
			artist?: string
		}>
		const artistIds = new Set<string>()
		const artists: UnifiedArtist[] = []

		for (const album of albums) {
			if (artists.length >= limit) break
			if (album.artistId && !artistIds.has(album.artistId)) {
				artistIds.add(album.artistId)
				try {
					const artist = await this.getArtist(album.artistId)
					artists.push(artist)
				} catch {
					// Skip artists that fail to load
				}
			}
		}

		return artists
	}

	async getFrequentArtists(limit: number = 20): Promise<UnifiedArtist[]> {
		// Get frequent albums and extract unique artists
		const response = await this.request<{
			albumList2?: { album?: unknown[] }
		}>('getAlbumList2.view', { type: 'frequent', size: String(limit * 2) })

		const albums = (response.albumList2?.album ?? []) as Array<{
			artistId?: string
			artist?: string
		}>
		const artistIds = new Set<string>()
		const artists: UnifiedArtist[] = []

		for (const album of albums) {
			if (artists.length >= limit) break
			if (album.artistId && !artistIds.has(album.artistId)) {
				artistIds.add(album.artistId)
				try {
					const artist = await this.getArtist(album.artistId)
					artists.push(artist)
				} catch {
					// Skip artists that fail to load
				}
			}
		}

		return artists
	}

	// =========================================================================
	// Album Discs
	// =========================================================================

	async getAlbumDiscs(albumId: string): Promise<Array<{ disc: number; tracks: UnifiedTrack[] }>> {
		const tracks = await this.getAlbumTracks(albumId)

		// Group by disc number
		const discMap = new Map<number, UnifiedTrack[]>()

		for (const track of tracks) {
			const discNum = track.discNumber ?? 1
			if (!discMap.has(discNum)) {
				discMap.set(discNum, [])
			}
			discMap.get(discNum)!.push(track)
		}

		// Sort discs and return
		return Array.from(discMap.entries())
			.sort(([a], [b]) => a - b)
			.map(([disc, discTracks]) => ({
				disc,
				tracks: discTracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)),
			}))
	}

	// =========================================================================
	// Generic Item Access
	// =========================================================================

	async getItem(
		id: string,
	): Promise<UnifiedTrack | UnifiedAlbum | UnifiedArtist | UnifiedPlaylist> {
		// Try track first (most common)
		try {
			const songResponse = await this.request<{ song?: unknown }>('getSong.view', { id })
			if (songResponse.song) {
				return mapSubsonicTrack(songResponse.song as Parameters<typeof mapSubsonicTrack>[0])
			}
		} catch {
			// Not a track, try album
		}

		// Try album
		try {
			const albumResponse = await this.request<{ album?: unknown }>('getAlbum.view', { id })
			if (albumResponse.album) {
				return mapSubsonicAlbum(
					albumResponse.album as Parameters<typeof mapSubsonicAlbum>[0],
				)
			}
		} catch {
			// Not an album, try artist
		}

		// Try artist
		try {
			const artistResponse = await this.request<{ artist?: unknown }>('getArtist.view', {
				id,
			})
			if (artistResponse.artist) {
				return mapSubsonicArtist(
					artistResponse.artist as Parameters<typeof mapSubsonicArtist>[0],
				)
			}
		} catch {
			// Not an artist, try playlist
		}

		// Try playlist
		const playlistResponse = await this.request<{ playlist?: unknown }>('getPlaylist.view', {
			id,
		})
		if (playlistResponse.playlist) {
			return mapSubsonicPlaylist(
				playlistResponse.playlist as Parameters<typeof mapSubsonicPlaylist>[0],
			)
		}

		throw new Error(`Item with id ${id} not found`)
	}

	// =========================================================================
	// Discovery Features
	// =========================================================================

	async getSearchSuggestions(limit: number = 10): Promise<{
		artists: UnifiedArtist[]
		albums: UnifiedAlbum[]
		tracks: UnifiedTrack[]
	}> {
		// Get recent and frequent albums and derive suggestions
		const [recentTracks, frequentTracks] = await Promise.all([
			this.getRecentTracks(limit * 2),
			this.getFrequentTracks(limit * 2),
		])

		// Extract unique artists
		const artistIds = new Set<string>()
		const artists: UnifiedArtist[] = []

		for (const track of [...recentTracks, ...frequentTracks]) {
			if (track.artistId && !artistIds.has(track.artistId) && artists.length < limit) {
				artistIds.add(track.artistId)
				try {
					artists.push(await this.getArtist(track.artistId))
				} catch {
					// Skip failed fetches
				}
			}
		}

		// Extract unique albums
		const albumIds = new Set<string>()
		const albums: UnifiedAlbum[] = []

		for (const track of [...recentTracks, ...frequentTracks]) {
			if (track.albumId && !albumIds.has(track.albumId) && albums.length < limit) {
				albumIds.add(track.albumId)
				try {
					albums.push(await this.getAlbum(track.albumId))
				} catch {
					// Skip failed fetches
				}
			}
		}

		// Dedupe tracks
		const trackIds = new Set<string>()
		const tracks: UnifiedTrack[] = []

		for (const track of [...recentTracks, ...frequentTracks]) {
			if (!trackIds.has(track.id) && tracks.length < limit) {
				trackIds.add(track.id)
				tracks.push(track)
			}
		}

		return { artists, albums, tracks }
	}

	async getDiscoverArtists(limit: number = 20): Promise<UnifiedArtist[]> {
		// Use random albums to get diverse artists
		const response = await this.request<{
			albumList2?: { album?: unknown[] }
		}>('getAlbumList2.view', { type: 'random', size: String(limit * 2) })

		const albums = (response.albumList2?.album ?? []) as Array<{ artistId?: string }>
		const artistIds = new Set<string>()
		const artists: UnifiedArtist[] = []

		for (const album of albums) {
			if (album.artistId && !artistIds.has(album.artistId) && artists.length < limit) {
				artistIds.add(album.artistId)
				try {
					artists.push(await this.getArtist(album.artistId))
				} catch {
					// Skip failed fetches
				}
			}
		}

		return artists
	}
}
