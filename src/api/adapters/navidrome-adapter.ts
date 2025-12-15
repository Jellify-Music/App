/**
 * Navidrome/Subsonic adapter implementing the MusicServerAdapter interface.
 * Uses direct fetch calls with hex-encoded password auth (no crypto required).
 */

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
	 * Make authenticated API request.
	 */
	private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
		const url = this.buildUrl(endpoint, params)
		const response = await fetch(url)

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		const data = await response.json()
		const subsonicResponse = data['subsonic-response']

		if (!subsonicResponse) {
			throw new Error('Invalid Subsonic response')
		}

		if (subsonicResponse.status === 'failed') {
			throw new Error(subsonicResponse.error?.message || 'Subsonic API error')
		}

		return subsonicResponse as T
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
			const response = await fetch(`${url}&${songParams}`)
			const data = await response.json()
			return mapSubsonicPlaylist(
				data['subsonic-response']?.playlist as Parameters<typeof mapSubsonicPlaylist>[0],
			)
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

		await fetch(url)
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
}
