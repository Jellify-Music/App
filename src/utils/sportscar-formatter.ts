import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { mapDtoToTrack } from './mappings'
import { useAllDownloadedTracks } from '../api/queries/download'
import useStreamingDeviceProfile from '../stores/device-profile'

export interface SportsCarItem {
	id: string
	title: string
	subtitle?: string
	isPlayable: boolean
	mediaType?: 'audio' | 'video' | 'folder'
	layoutType?: 'list' | 'grid'
	iconUrl?: string
	mediaUrl?: string
	durationMs?: number
	metadata?: Record<string, any>
	children?: SportsCarItem[]
}

export interface SportsCarData {
	layoutType: 'list'
	rootItems: SportsCarItem[]
	appName?: string
	appIconUrl?: string
}

/**
 * Formats Jellyfin recently played tracks for SportsCar
 * First maps to internal track format, then converts to SportsCar format
 */
export function formatRecentlyPlayedForSportsCar(
	recentTracks: BaseItemDto[],
	api: Api | undefined,
	downloadedTracks: any[] = [],
	deviceProfile: any = {}
): SportsCarItem[] {
	if (!recentTracks || recentTracks.length === 0 || !api) {
		return []
	}

	return recentTracks.map((track) => {
		if (!track.Id) {
			console.warn('Track missing ID, skipping:', track)
			return null
		}

		// First map to internal track format using existing function
		const internalTrack = mapDtoToTrack(api, track, downloadedTracks, deviceProfile)

		return {
			id: track.Id,
			title: internalTrack.title || 'Unknown Track',
			subtitle: internalTrack.artist || 'Unknown Artist',
			isPlayable: true,
			mediaType: 'audio' as const,
			iconUrl: internalTrack.artwork || (track.AlbumId 
				? getImageApi(api).getItemImageUrlById(track.AlbumId, ImageType.Primary)
				: undefined),
			mediaUrl: internalTrack.url,
			durationMs: internalTrack.duration ? Math.floor(internalTrack.duration * 1000) : undefined,
			metadata: {
				album: internalTrack.album,
				artist: internalTrack.artist,
				year: track.ProductionYear,
				genre: track.Genres?.join(', '),
			},
		}
	}).filter((item): item is NonNullable<typeof item> => item !== null) as SportsCarItem[]
}

/**
 * Formats Jellyfin albums for SportsCar
 */
export function formatAlbumsForSportsCar(
	albums: BaseItemDto[],
	api: Api | undefined
): SportsCarItem[] {
	if (!api) return []
	
	return albums.map((album) => ({
		id: album.Id!,
		title: album.Name || 'Unknown Album',
		subtitle: album.Artists?.join(', ') || 'Unknown Artist',
		isPlayable: false,
		mediaType: 'folder' as const,
		layoutType: 'grid' as const,
		iconUrl: getImageApi(api).getItemImageUrlById(album.Id!, ImageType.Primary),
		children: [], // Will be populated when tracks are loaded
	}))
}

/**
 * Formats Jellyfin artists for SportsCar
 */
export function formatArtistsForSportsCar(
	artists: BaseItemDto[],
	api: Api | undefined
): SportsCarItem[] {
	if (!api) return []
	
	return artists.map((artist) => ({
		id: artist.Id!,
		title: artist.Name || 'Unknown Artist',
		subtitle: `${artist.SongCount || 0} songs`,
		isPlayable: false,
		mediaType: 'folder' as const,
		layoutType: 'grid' as const,
		iconUrl: getImageApi(api).getItemImageUrlById(artist.Id!, ImageType.Primary),
		children: [], // Will be populated when albums are loaded
	}))
}

/**
 * Formats Jellyfin playlists for SportsCar
 */
export function formatPlaylistsForSportsCar(
	playlists: BaseItemDto[],
	api: Api | undefined
): SportsCarItem[] {
	if (!api) return []
	
	return playlists.map((playlist) => ({
		id: playlist.Id!,
		title: playlist.Name || 'Unknown Playlist',
		subtitle: `${playlist.SongCount || 0} songs`,
		isPlayable: true,
		mediaType: 'audio' as const,
		layoutType: 'grid' as const,
		iconUrl: getImageApi(api).getItemImageUrlById(playlist.Id!, ImageType.Primary),
		mediaUrl: playlist.Id 
			? `${api.basePath}/Playlists/${playlist.Id}/Items?api_key=${api.accessToken}`
			: undefined,
		durationMs: playlist.RunTimeTicks ? Math.floor(playlist.RunTimeTicks / 10000) : undefined,
		metadata: {
			songCount: playlist.SongCount,
			totalDuration: playlist.RunTimeTicks ? Math.floor(playlist.RunTimeTicks / 10000) : undefined,
		},
	}))
}

/**
 * Creates the main SportsCar data structure with recently played section
 */
export function createSportsCarData(
	recentTracks: BaseItemDto[],
	api: Api | undefined,
	downloadedTracks: any[] = [],
	deviceProfile: any = {}
): SportsCarData {
	return {
		layoutType: 'list',
		appName: 'Jellify',
		rootItems: [
			{
				id: 'recently_played',
				title: 'Recently Played',
				subtitle: 'Your recently played tracks',
				isPlayable: false,
				mediaType: 'folder',
				layoutType: 'list',
				children: formatRecentlyPlayedForSportsCar(recentTracks, api, downloadedTracks, deviceProfile),
			},
		],
	}
}

/**
 * Updates the SportsCar data with new recently played tracks
 */
export function updateSportsCarData(
	recentTracks: BaseItemDto[],
	api: Api | undefined,
	downloadedTracks: any[] = [],
	deviceProfile: any = {}
): SportsCarData {
	return createSportsCarData(recentTracks, api, downloadedTracks, deviceProfile)
}
