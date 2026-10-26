import { Platform } from 'react-native'
import { getBundleId } from 'react-native-device-info'
import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api'
import {
	AndroidAutoMediaLibraryHelper,
	PlayerQueue,
	TrackPlayer,
	type MediaItem,
} from 'react-native-nitro-player'

import NetInfo from '@react-native-community/netinfo'
import { getApi, getLibrary, getUser } from '../stores/auth/utils'
import useJellifyStore from '../stores/auth'
import { restoreFromStorage } from './player/utils/initialization'
import { useAutoStore } from '../stores/auto'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../api/queries/frequents/utils/frequents'
import { fetchUserPlaylists } from '../api/queries/playlist/utils'
import { getItemImageUrl } from '../api/queries/image/utils'
import { mapDtosToTracks } from '../utils/mapping/item-to-track'
import { ensureDownloadedTracks } from '../hooks/downloads/utils'

/**
 * Playlists we materialize for Android Auto are tagged with this prefix so
 * `clearPlaylists` can leave them untouched when the user starts a new queue.
 */
export const AA_PLAYLIST_NAME_PREFIX = 'jellify-aa:'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
const TILE_LIMIT = 500
const PAGE_SIZE = 200
const TRACK_FIELDS = [ItemFields.MediaSources, ItemFields.ParentId, ItemFields.Path]

// Grid tiles without an icon render as a broken-image glyph in the car
const FALLBACK_ICON = `android.resource://${getBundleId()}/drawable/ic_notification`

const ROOT: MediaItem[] = [
	folder('home', 'Home', { iconUrl: undefined, layoutType: 'grid' }),
	folder('artists', 'Artists', { iconUrl: undefined, layoutType: 'list' }),
	folder('albums', 'Albums', { iconUrl: undefined, layoutType: 'list' }),
	folder('playlists', 'Playlists', { iconUrl: undefined, layoutType: 'grid' }),
]

function folder(id: string, title: string, extra: Partial<MediaItem> = {}): MediaItem {
	return {
		id,
		title,
		isPlayable: false,
		mediaType: 'folder',
		children: [],
		iconUrl: FALLBACK_ICON,
		...extra,
	}
}

const cover = (item: BaseItemDto | undefined) =>
	(item && getItemImageUrl(item, ImageType.Primary, { maxWidth: 300, maxHeight: 300 })) ??
	FALLBACK_ICON

function tile(kind: 'artist' | 'album' | 'playlist', item: BaseItemDto, groupTitle?: string) {
	return folder(`${kind}:${item.Id}`, item.Name ?? '', {
		subtitle: kind === 'album' ? (item.AlbumArtist ?? undefined) : undefined,
		iconUrl: cover(item),
		layoutType: kind === 'artist' ? 'grid' : 'list',
		groupTitle,
	})
}

const message = (title: string): MediaItem => folder(`message:${title}`, title)

// Tracks only play from a PlayerQueue playlist; build one per opened list, replacing the previous copy afterwards
async function playableTracks(key: string, items: BaseItemDto[]): Promise<MediaItem[]> {
	const tracks = mapDtosToTracks(
		items.filter((item) => item.Type === BaseItemKind.Audio),
		await ensureDownloadedTracks(),
	)
	if (tracks.length === 0) return [message('Nothing here yet')]

	const name = `${AA_PLAYLIST_NAME_PREFIX}${key}`
	const { currentPlaylistId } = await TrackPlayer.getState()
	const previous = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name === name && p.id !== currentPlaylistId,
	)
	const playlistId = await PlayerQueue.createPlaylist(name)
	await PlayerQueue.addTracksToPlaylist(playlistId, tracks)
	await Promise.all(previous.map((p) => PlayerQueue.deletePlaylist(p.id)))

	// A song repeated in a playlist gets "id#index" so the car plays the occurrence that was tapped
	const seen = new Set<string>()
	return tracks.map((track, index) => ({
		id: `${playlistId}:${seen.has(track.id) ? `${track.id}#${index}` : (seen.add(track.id), track.id)}`,
		title: track.title,
		subtitle: track.artist,
		iconUrl: track.artwork ?? undefined,
		isPlayable: true,
		mediaType: 'audio',
	}))
}

async function getItems(params: Parameters<ReturnType<typeof getItemsApi>['getItems']>[0]) {
	const { data } = await getItemsApi(getApi()!).getItems({
		userId: getUser()?.id,
		enableUserData: true,
		...params,
	})
	return data.Items ?? []
}

function favoriteTracks(musicLibraryId: string) {
	return getItems({
		parentId: musicLibraryId,
		includeItemTypes: [BaseItemKind.Audio],
		recursive: true,
		isFavorite: true,
		sortBy: [ItemSortBy.SortName],
		limit: TILE_LIMIT,
		fields: TRACK_FIELDS,
	})
}

function byLetter(letter: string) {
	return letter === '#' ? { nameLessThan: 'A' } : { nameStartsWith: letter }
}

// "More" keeps long lists reachable without one oversized car result
function withMore(base: string, offset: number, items: MediaItem[]): MediaItem[] {
	if (items.length <= PAGE_SIZE) return items
	return [...items.slice(0, PAGE_SIZE), folder(`${base}@${offset + PAGE_SIZE}`, 'More…')]
}

async function loadChildren(parentId: string): Promise<MediaItem[] | null> {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()
	if (!api || !user || !library) return [message('Open Jellify on your phone to sign in')]

	const [base, offsetText] = parentId.split('@')
	const offset = Number(offsetText) || 0
	const separator = base.indexOf(':')
	const kind = separator < 0 ? base : base.slice(0, separator)
	const id = separator < 0 ? '' : base.slice(separator + 1)
	const musicLibraryId = library.musicLibraryId
	const page = { startIndex: offset, limit: PAGE_SIZE + 1 }

	switch (kind) {
		case 'retry':
			return loadChildren(id)
		case 'home': {
			const firstTrack = (params: Parameters<typeof getItems>[0]) =>
				getItems({
					parentId: musicLibraryId,
					includeItemTypes: [BaseItemKind.Audio],
					recursive: true,
					limit: 1,
					...params,
				})
			const [recentlyAdded, ...picks] = await Promise.all(
				[
					fetchRecentlyAdded(api, library, 0),
					firstTrack({
						sortBy: [ItemSortBy.DatePlayed],
						sortOrder: [SortOrder.Descending],
					}),
					firstTrack({
						sortBy: [ItemSortBy.PlayCount],
						sortOrder: [SortOrder.Descending],
					}),
					firstTrack({ isFavorite: true }),
				].map((request) => request.catch((): BaseItemDto[] => [])),
			)
			const pick = (id: string, title: string, items: BaseItemDto[]) =>
				folder(`picks:${id}`, title, {
					groupTitle: 'Quick picks',
					iconUrl: cover(items.find((item) => item.Type === BaseItemKind.Audio)),
				})
			return [
				pick('recents', 'Play it again', picks[0]),
				pick('frequents', 'On Repeat', picks[1]),
				pick('favorites', 'Favourites', picks[2]),
				...recentlyAdded
					.filter((item) => item.Type === BaseItemKind.MusicAlbum)
					.map((album) => tile('album', album, 'Recently added')),
			]
		}
		case 'artists':
		case 'albums':
			if (!id)
				return LETTERS.map((letter) =>
					folder(`${kind}:${letter}`, letter, { iconUrl: undefined, layoutType: 'grid' }),
				)
			return withMore(
				base,
				offset,
				kind === 'artists'
					? ((
							await getArtistsApi(api).getAlbumArtists({
								parentId: musicLibraryId,
								userId: user.id,
								sortBy: [ItemSortBy.SortName],
								sortOrder: [SortOrder.Ascending],
								enableImages: true,
								...page,
								...byLetter(id),
							})
						).data.Items?.map((artist) => tile('artist', artist)) ?? [])
					: (
							await getItems({
								parentId: musicLibraryId,
								includeItemTypes: [BaseItemKind.MusicAlbum],
								recursive: true,
								sortBy: [ItemSortBy.SortName],
								...page,
								...byLetter(id),
							})
						).map((album) => tile('album', album)),
			)
		case 'artist':
			return withMore(
				base,
				offset,
				(
					await getItems({
						parentId: musicLibraryId,
						includeItemTypes: [BaseItemKind.MusicAlbum],
						recursive: true,
						albumArtistIds: [id],
						sortBy: [ItemSortBy.PremiereDate, ItemSortBy.SortName],
						sortOrder: [SortOrder.Descending],
						...page,
					})
				).map((album) => tile('album', album)),
			)
		case 'playlists':
			return withMore(
				base,
				offset,
				(await fetchUserPlaylists(api, user, [ItemSortBy.SortName]))
					.slice(offset, offset + PAGE_SIZE + 1)
					.map((playlist) => tile('playlist', playlist)),
			)
		case 'album':
			return playableTracks(
				base,
				await getItems({
					parentId: id,
					includeItemTypes: [BaseItemKind.Audio],
					sortBy: [
						ItemSortBy.ParentIndexNumber,
						ItemSortBy.IndexNumber,
						ItemSortBy.SortName,
					],
					fields: TRACK_FIELDS,
				}),
			)
		case 'playlist':
			return playableTracks(
				base,
				await getItems({
					parentId: id,
					includeItemTypes: [BaseItemKind.Audio],
					fields: TRACK_FIELDS,
				}),
			)
		case 'picks':
			return playableTracks(
				base,
				id === 'recents'
					? await fetchRecentlyPlayed(api, user, library, 0)
					: id === 'frequents'
						? await fetchFrequentlyPlayed(api, library, 0)
						: await favoriteTracks(musicLibraryId),
			)
		default:
			return []
	}
}

async function search(query: string): Promise<MediaItem[]> {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()
	if (!api || !user || !library) return [message('Open Jellify on your phone to sign in')]

	const [items, artists, playlists] = await Promise.all([
		getItems({
			parentId: library.musicLibraryId,
			searchTerm: query,
			recursive: true,
			includeItemTypes: [BaseItemKind.Audio, BaseItemKind.MusicAlbum],
			limit: 40,
			fields: TRACK_FIELDS,
		}),
		getArtistsApi(api)
			.getAlbumArtists({
				parentId: library.musicLibraryId,
				userId: user.id,
				searchTerm: query,
				limit: 10,
			})
			.then(({ data }) => data.Items ?? []),
		getItems({
			searchTerm: query,
			recursive: true,
			includeItemTypes: [BaseItemKind.Playlist],
			limit: 10,
		}),
	])
	const songs = items.some((item) => item.Type === BaseItemKind.Audio)
		? (await playableTracks('search', items)).map((song) => ({ ...song, groupTitle: 'Songs' }))
		: []
	return [
		...songs,
		...playlists.map((playlist) => tile('playlist', playlist, 'Playlists')),
		...artists.map((artist) => tile('artist', artist, 'Artists')),
		...items
			.filter((item) => item.Type === BaseItemKind.MusicAlbum)
			.map((album) => tile('album', album, 'Albums')),
	]
}

// A request the car is waiting on must not hang or blank the screen on a server error
const answering = (load: (argument: string) => Promise<MediaItem[] | null>) => (argument: string) =>
	load(argument).catch((error) => {
		console.warn('Android Auto: request failed', error)
		if (error?.response?.status === 401)
			return [message('Sign in again in Jellify on your phone')]
		return [
			folder(`retry:${argument}`, "Couldn't reach your Jellyfin server", {
				subtitle: 'Tap to try again',
			}),
		]
	})

/** Deletes car playlists from earlier sessions, keeping the one that may be playing. */
async function deleteStaleAaPlaylists(): Promise<void> {
	const { currentPlaylistId } = await TrackPlayer.getState()
	const stale = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name.startsWith(AA_PLAYLIST_NAME_PREFIX) && p.id !== currentPlaylistId,
	)
	await Promise.all(stale.map((p) => PlayerQueue.deletePlaylist(p.id).catch(() => undefined)))
}

let isRegistered = false

/** Re-publishes the car tree; Android Auto then reloads every folder it has open. */
export function refreshAndroidAutoLibrary(): void {
	if (!isRegistered) return
	AndroidAutoMediaLibraryHelper.set({ layoutType: 'grid', rootItems: ROOT, appName: 'Jellify' })
}

export function registerAndroidAutoService(): () => void {
	if (Platform.OS !== 'android' || !AndroidAutoMediaLibraryHelper.isAvailable()) return () => {}

	// Guard against re-registration on JS reload — the native side keeps every listener we add
	if (isRegistered) return () => {}
	isRegistered = true

	// The tree is fetched per folder from the server, so a car-only start needs no cached data
	refreshAndroidAutoLibrary()
	AndroidAutoMediaLibraryHelper.setChildrenLoader(answering(loadChildren))
	AndroidAutoMediaLibraryHelper.setSearchHandler(answering(search))
	// Restoring only on request keeps a car-only start from overwriting what the driver picks
	AndroidAutoMediaLibraryHelper.onPlaybackResumption(() => {
		restoreFromStorage()
	})

	TrackPlayer.onAndroidAutoConnectionChange((connected: boolean) =>
		useAutoStore.getState().setIsConnected(connected),
	)
	useAutoStore.getState().setIsConnected(TrackPlayer.isAndroidAutoConnected())

	// Failed or signed-out folders recover on their own once the cause goes away
	let wasReachable = true
	NetInfo.addEventListener(({ isInternetReachable }) => {
		if (isInternetReachable === false) wasReachable = false
		else if (isInternetReachable && !wasReachable) {
			wasReachable = true
			refreshAndroidAutoLibrary()
		}
	})
	useJellifyStore.subscribe((state, previous) => {
		if (
			state.user !== previous.user ||
			state.server !== previous.server ||
			state.library !== previous.library
		)
			refreshAndroidAutoLibrary()
	})

	deleteStaleAaPlaylists()

	return () => {}
}
