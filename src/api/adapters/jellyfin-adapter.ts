/**
 * Jellyfin adapter implementing the MusicServerAdapter interface.
 * Wraps the existing @jellyfin/sdk API calls.
 */

import { Api } from '@jellyfin/sdk'
import {
	BaseItemKind,
	ItemSortBy,
	SortOrder,
	ItemFields,
} from '@jellyfin/sdk/lib/generated-client/models'
import {
	getItemsApi,
	getPlaylistsApi,
	getUserLibraryApi,
	getInstantMixApi,
	getPlaystateApi,
	getArtistsApi,
	getLyricsApi,
	getLibraryApi,
} from '@jellyfin/sdk/lib/utils/api'
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
	mapJellyfinAlbum,
	mapJellyfinAlbums,
	mapJellyfinArtist,
	mapJellyfinArtists,
	mapJellyfinPlaylist,
	mapJellyfinPlaylists,
	mapJellyfinSearchResults,
	mapJellyfinStarred,
	mapJellyfinTrack,
	mapJellyfinTracks,
	getJellyfinCoverArtUrl,
	getJellyfinStreamUrl,
	getJellyfinDownloadUrl,
} from './jellyfin-mappings'
import JellifyTrack from '../../types/JellifyTrack'
import { QueuingType } from '../../enums/queuing-type'

/**
 * Jellyfin implementation of MusicServerAdapter.
 */
export class JellyfinAdapter implements MusicServerAdapter {
	readonly backend = 'jellyfin' as const

	constructor(
		private api: Api,
		private userId: string,
		private libraryId?: string,
	) {}

	// =========================================================================
	// Connection & Authentication
	// =========================================================================

	async ping(): Promise<boolean> {
		try {
			// Use getItems with limit 0 as a ping - if it works, server is up
			await getItemsApi(this.api).getItems({ limit: 0 })
			return true
		} catch {
			return false
		}
	}

	async authenticate(_username: string, _password: string): Promise<AuthResult> {
		// Authentication is handled separately in Jellify's current flow
		// This would need integration with getUserApi().authenticateUserByName
		throw new Error('Use the existing authentication flow')
	}

	// =========================================================================
	// Browsing - Artists
	// =========================================================================

	async getArtists(libraryId?: string): Promise<UnifiedArtist[]> {
		const response = await getArtistsApi(this.api).getArtists({
			parentId: libraryId ?? this.libraryId,
			sortBy: [ItemSortBy.SortName],
			sortOrder: [SortOrder.Ascending],
		})
		return mapJellyfinArtists(response.data.Items ?? [])
	}

	async getArtist(id: string): Promise<UnifiedArtist> {
		const response = await getUserLibraryApi(this.api).getItem({
			itemId: id,
			userId: this.userId,
		})
		return mapJellyfinArtist(response.data)
	}

	async getArtistAlbums(artistId: string): Promise<UnifiedAlbum[]> {
		const response = await getItemsApi(this.api).getItems({
			parentId: this.libraryId,
			includeItemTypes: [BaseItemKind.MusicAlbum],
			artistIds: [artistId],
			recursive: true,
			sortBy: [ItemSortBy.ProductionYear, ItemSortBy.SortName],
			sortOrder: [SortOrder.Descending, SortOrder.Ascending],
		})
		return mapJellyfinAlbums(response.data.Items ?? [])
	}

	// =========================================================================
	// Browsing - Albums
	// =========================================================================

	async getAlbums(options?: AlbumQueryOptions): Promise<UnifiedAlbum[]> {
		const sortMapping: Record<string, ItemSortBy[]> = {
			recent: [ItemSortBy.DatePlayed],
			frequent: [ItemSortBy.PlayCount],
			random: [ItemSortBy.Random],
			newest: [ItemSortBy.DateCreated],
			alphabetical: [ItemSortBy.SortName],
		}

		const response = await getItemsApi(this.api).getItems({
			parentId: this.libraryId,
			includeItemTypes: [BaseItemKind.MusicAlbum],
			artistIds: options?.artistId ? [options.artistId] : undefined,
			recursive: true,
			sortBy: options?.type ? sortMapping[options.type] : [ItemSortBy.SortName],
			sortOrder: [
				options?.type === 'alphabetical' ? SortOrder.Ascending : SortOrder.Descending,
			],
			limit: options?.limit,
			startIndex: options?.offset,
		})
		return mapJellyfinAlbums(response.data.Items ?? [])
	}

	async getAlbum(id: string): Promise<UnifiedAlbum> {
		const response = await getUserLibraryApi(this.api).getItem({
			itemId: id,
			userId: this.userId,
		})
		return mapJellyfinAlbum(response.data)
	}

	async getAlbumTracks(albumId: string): Promise<UnifiedTrack[]> {
		const response = await getItemsApi(this.api).getItems({
			parentId: albumId,
			includeItemTypes: [BaseItemKind.Audio],
			sortBy: [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber],
			sortOrder: [SortOrder.Ascending, SortOrder.Ascending],
			fields: [ItemFields.MediaSources],
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	// =========================================================================
	// Browsing - Tracks
	// =========================================================================

	async getTracks(options?: TrackQueryOptions): Promise<UnifiedTrack[]> {
		const response = await getItemsApi(this.api).getItems({
			parentId: options?.albumId ?? options?.playlistId ?? this.libraryId,
			includeItemTypes: [BaseItemKind.Audio],
			artistIds: options?.artistId ? [options.artistId] : undefined,
			recursive: !options?.albumId && !options?.playlistId,
			sortBy: [ItemSortBy.SortName],
			sortOrder: [SortOrder.Ascending],
			limit: options?.limit,
			startIndex: options?.offset,
			fields: [ItemFields.MediaSources],
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	async getTrack(id: string): Promise<UnifiedTrack> {
		const response = await getUserLibraryApi(this.api).getItem({
			itemId: id,
			userId: this.userId,
		})
		return mapJellyfinTrack(response.data)
	}

	// =========================================================================
	// Search
	// =========================================================================

	async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResults> {
		const response = await getItemsApi(this.api).getItems({
			parentId: this.libraryId,
			searchTerm: query.trim(),
			recursive: true,
			includeItemTypes: [
				BaseItemKind.MusicArtist,
				BaseItemKind.MusicAlbum,
				BaseItemKind.Audio,
				BaseItemKind.Playlist,
			],
			limit: options?.limit ?? 50,
			sortBy: [ItemSortBy.SortName],
			sortOrder: [SortOrder.Ascending],
		})
		return mapJellyfinSearchResults(response.data.Items ?? [])
	}

	// =========================================================================
	// Playlists
	// =========================================================================

	async getPlaylists(): Promise<UnifiedPlaylist[]> {
		const response = await getItemsApi(this.api).getItems({
			userId: this.userId,
			includeItemTypes: [BaseItemKind.Playlist],
			sortBy: [ItemSortBy.SortName],
			sortOrder: [SortOrder.Ascending],
		})
		return mapJellyfinPlaylists(response.data.Items ?? [])
	}

	async getPlaylistTracks(playlistId: string): Promise<UnifiedTrack[]> {
		const response = await getItemsApi(this.api).getItems({
			parentId: playlistId,
			includeItemTypes: [BaseItemKind.Audio],
			fields: [ItemFields.MediaSources],
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	async createPlaylist(name: string, trackIds?: string[]): Promise<UnifiedPlaylist> {
		const response = await getPlaylistsApi(this.api).createPlaylist({
			createPlaylistDto: {
				Name: name,
				Ids: trackIds,
				UserId: this.userId,
			},
		})
		// Fetch the created playlist to get full details
		const playlist = await getUserLibraryApi(this.api).getItem({
			itemId: response.data.Id!,
			userId: this.userId,
		})
		return mapJellyfinPlaylist(playlist.data)
	}

	async updatePlaylist(
		id: string,
		updates: {
			name?: string
			trackIdsToAdd?: string[]
			trackIndicesToRemove?: number[]
		},
	): Promise<void> {
		if (updates.name) {
			await getPlaylistsApi(this.api).updatePlaylist({
				playlistId: id,
				updatePlaylistDto: { Name: updates.name },
			})
		}
		if (updates.trackIdsToAdd?.length) {
			await getPlaylistsApi(this.api).addItemToPlaylist({
				playlistId: id,
				ids: updates.trackIdsToAdd,
			})
		}
		if (updates.trackIndicesToRemove?.length) {
			// Need to get playlist items first to get entry IDs
			const items = await getItemsApi(this.api).getItems({ parentId: id })
			const entryIds = updates.trackIndicesToRemove
				.map((idx) => items.data.Items?.[idx]?.PlaylistItemId)
				.filter(Boolean) as string[]
			if (entryIds.length) {
				await getPlaylistsApi(this.api).removeItemFromPlaylist({
					playlistId: id,
					entryIds,
				})
			}
		}
	}

	async deletePlaylist(id: string): Promise<void> {
		await getLibraryApi(this.api).deleteItem({ itemId: id })
	}

	// =========================================================================
	// Favorites
	// =========================================================================

	async star(id: string): Promise<void> {
		await getUserLibraryApi(this.api).markFavoriteItem({
			itemId: id,
			userId: this.userId,
		})
	}

	async unstar(id: string): Promise<void> {
		await getUserLibraryApi(this.api).unmarkFavoriteItem({
			itemId: id,
			userId: this.userId,
		})
	}

	async getStarred(): Promise<UnifiedStarred> {
		const [artists, albums, tracks] = await Promise.all([
			getItemsApi(this.api).getItems({
				parentId: this.libraryId,
				includeItemTypes: [BaseItemKind.MusicArtist],
				isFavorite: true,
				recursive: true,
			}),
			getItemsApi(this.api).getItems({
				parentId: this.libraryId,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				isFavorite: true,
				recursive: true,
			}),
			getItemsApi(this.api).getItems({
				parentId: this.libraryId,
				includeItemTypes: [BaseItemKind.Audio],
				isFavorite: true,
				recursive: true,
			}),
		])

		return mapJellyfinStarred(
			artists.data.Items ?? [],
			albums.data.Items ?? [],
			tracks.data.Items ?? [],
		)
	}

	// =========================================================================
	// Playback & Streaming
	// =========================================================================

	getStreamUrl(trackId: string, _options?: StreamOptions): string {
		return getJellyfinStreamUrl(this.api, trackId)
	}

	getCoverArtUrl(id: string, size?: number): string {
		return getJellyfinCoverArtUrl(this.api, id, size)
	}

	getDownloadUrl(trackId: string): string {
		return getJellyfinDownloadUrl(this.api, trackId)
	}

	mapToJellifyTrack(
		track: UnifiedTrack,
		queuingType?: QueuingType,
		_streamOptions?: StreamOptions, // Jellyfin uses device profiles, not URL params
	): JellifyTrack {
		const streamUrl = this.getStreamUrl(track.id)
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
			// Create a slimified BaseItemDto-compatible object
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
			backend: 'jellyfin',
			sessionId: null, // Will be populated by media info queries if needed
			sourceType: 'stream',
			QueuingType: queuingType,
			headers: this.api.accessToken ? { 'X-Emby-Token': this.api.accessToken } : undefined,
		} as JellifyTrack
	}

	async reportPlaybackStart(trackId: string): Promise<void> {
		await getPlaystateApi(this.api).reportPlaybackStart({
			playbackStartInfo: { ItemId: trackId },
		})
	}

	async reportPlaybackProgress(trackId: string, position: number): Promise<void> {
		await getPlaystateApi(this.api).reportPlaybackProgress({
			playbackProgressInfo: {
				ItemId: trackId,
				PositionTicks: position * 10_000_000, // seconds to ticks
			},
		})
	}

	async reportPlaybackEnd(trackId: string, position: number, completed: boolean): Promise<void> {
		if (completed) {
			await getPlaystateApi(this.api).markPlayedItem({
				itemId: trackId,
				userId: this.userId,
			})
		}
		await getPlaystateApi(this.api).reportPlaybackStopped({
			playbackStopInfo: {
				ItemId: trackId,
				PositionTicks: position * 10_000_000,
			},
		})
	}

	// =========================================================================
	// Optional Features
	// =========================================================================

	async getInstantMix(seedId: string, limit?: number): Promise<UnifiedTrack[]> {
		const response = await getInstantMixApi(this.api).getInstantMixFromItem({
			itemId: seedId,
			userId: this.userId,
			limit: limit ?? 50,
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	async getSimilarArtists(artistId: string): Promise<UnifiedArtist[]> {
		const response = await getUserLibraryApi(this.api).getItem({
			itemId: artistId,
			userId: this.userId,
		})
		// Jellyfin doesn't have direct similar artists API,
		// would need to use Last.fm integration or artist info
		return []
	}

	async getLyrics(trackId: string): Promise<UnifiedLyrics | null> {
		try {
			const response = await getLyricsApi(this.api).getLyrics({
				itemId: trackId,
			})
			const lyrics = response.data.Lyrics
			if (!lyrics?.length) return null

			return {
				lines: lyrics.map((line) => ({
					start: (line.Start ?? 0) / 10_000_000, // ticks to seconds
					text: line.Text ?? '',
				})),
			}
		} catch {
			return null
		}
	}

	// =========================================================================
	// Home Content
	// =========================================================================

	async getRecentTracks(limit: number = 50): Promise<UnifiedTrack[]> {
		const response = await getItemsApi(this.api).getItems({
			userId: this.userId,
			parentId: this.libraryId,
			includeItemTypes: [BaseItemKind.Audio],
			sortBy: [ItemSortBy.DatePlayed],
			sortOrder: [SortOrder.Descending],
			recursive: true,
			limit,
			fields: [ItemFields.MediaSources],
			enableUserData: true,
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	async getFrequentTracks(limit: number = 50): Promise<UnifiedTrack[]> {
		const response = await getItemsApi(this.api).getItems({
			userId: this.userId,
			parentId: this.libraryId,
			includeItemTypes: [BaseItemKind.Audio],
			sortBy: [ItemSortBy.PlayCount],
			sortOrder: [SortOrder.Descending],
			recursive: true,
			limit,
			fields: [ItemFields.MediaSources],
			enableUserData: true,
		})
		return mapJellyfinTracks(response.data.Items ?? [])
	}

	async getRecentArtists(limit: number = 20): Promise<UnifiedArtist[]> {
		// Jellyfin: Get recently played tracks, extract unique artists
		const tracks = await this.getRecentTracks(100)
		const artistMap = new Map<string, UnifiedArtist>()

		for (const track of tracks) {
			if (track.artistId && !artistMap.has(track.artistId)) {
				try {
					const artist = await this.getArtist(track.artistId)
					artistMap.set(track.artistId, artist)
					if (artistMap.size >= limit) break
				} catch {
					// Skip if artist fetch fails
				}
			}
		}

		return Array.from(artistMap.values())
	}

	async getFrequentArtists(limit: number = 20): Promise<UnifiedArtist[]> {
		// Jellyfin: Get frequently played tracks, aggregate by artist
		const tracks = await this.getFrequentTracks(200)
		const artistPlayCount = new Map<string, { artist: UnifiedArtist; count: number }>()

		for (const track of tracks) {
			if (track.artistId) {
				const existing = artistPlayCount.get(track.artistId)
				if (existing) {
					existing.count++
				} else {
					try {
						const artist = await this.getArtist(track.artistId)
						artistPlayCount.set(track.artistId, { artist, count: 1 })
					} catch {
						// Skip if artist fetch fails
					}
				}
			}
		}

		return Array.from(artistPlayCount.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, limit)
			.map((item) => item.artist)
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
		const response = await getUserLibraryApi(this.api).getItem({
			itemId: id,
			userId: this.userId,
		})
		const item = response.data

		// Map based on item type
		switch (item.Type) {
			case BaseItemKind.Audio:
				return mapJellyfinTrack(item)
			case BaseItemKind.MusicAlbum:
				return mapJellyfinAlbum(item)
			case BaseItemKind.MusicArtist:
				return mapJellyfinArtist(item)
			case BaseItemKind.Playlist:
				return mapJellyfinPlaylist(item)
			default:
				// Default to album mapping for unknown types
				return mapJellyfinAlbum(item)
		}
	}

	// =========================================================================
	// Discovery Features
	// =========================================================================

	async getSearchSuggestions(limit: number = 10): Promise<{
		artists: UnifiedArtist[]
		albums: UnifiedAlbum[]
		tracks: UnifiedTrack[]
	}> {
		// Get recent and frequent items for suggestions
		const [recentTracks, frequentTracks] = await Promise.all([
			this.getRecentTracks(limit * 2),
			this.getFrequentTracks(limit * 2),
		])

		// Extract unique artists from tracks
		const artistIds = new Set<string>()
		const artists: UnifiedArtist[] = []

		for (const track of [...recentTracks, ...frequentTracks]) {
			if (track.artistId && !artistIds.has(track.artistId) && artists.length < limit) {
				artistIds.add(track.artistId)
				try {
					artists.push(await this.getArtist(track.artistId))
				} catch {
					// Skip failed artist fetches
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
					// Skip failed album fetches
				}
			}
		}

		// Dedupe and limit tracks
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
		// Get random artists for discovery
		const response = await getItemsApi(this.api).getItems({
			parentId: this.libraryId,
			includeItemTypes: [BaseItemKind.MusicArtist],
			sortBy: [ItemSortBy.Random],
			limit,
			recursive: true,
		})
		return mapJellyfinArtists(response.data.Items ?? [])
	}
}
