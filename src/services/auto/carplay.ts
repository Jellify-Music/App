import { Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import {
	CarPlayHelper,
	DownloadManager,
	PlayerQueue,
	TrackPlayer,
	type CarPlayImageRow,
	type CarPlayListItem,
	type CarPlayListSection,
	type CarPlayListTemplate,
	type CarPlayTemplate,
	type TrackItem,
} from 'react-native-nitro-player'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import useJellifyStore from '../../stores/auth'
import { useAutoStore } from '../../stores/auto'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../../api/queries/frequents/utils/frequents'
import { refreshPlaylistTracks, refreshUserPlaylists } from '../../api/queries/playlist/cache'
import { getItemImageUrl } from '../../api/queries/image/utils'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { AA_PLAYLIST_NAME_PREFIX } from './android-auto'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
const TILE_LIMIT = 500
const PAGE_SIZE = 100
const TRACK_FIELDS = [ItemFields.MediaSources, ItemFields.ParentId, ItemFields.Path]
const RETRY_ID = 'retry'
const TILES = 8

// Lazy tabs show at once on a start from the car and fill in once JS is up
const TABS: CarPlayListTemplate[] = [
	tab('home', 'Home', 'house.fill'),
	tab('artists', 'Artists', 'music.mic'),
	tab('albums', 'Albums', 'square.stack.fill'),
	tab('playlists', 'Playlists', 'music.note.list'),
]

function tab(id: string, title: string, image: string): CarPlayListTemplate {
	return { type: 'list', id, title, lazy: true, tab: { title, image } }
}

// Titles of lists that can be opened, so their "More…" pages keep the name
const titles = new Map(TABS.map((template) => [template.id, template.title]))

function opens(id: string, title: string): CarPlayListTemplate {
	titles.set(id, title)
	return { type: 'list', id, title, lazy: true }
}

const cover = (item: BaseItemDto | undefined) =>
	item && getItemImageUrl(item, ImageType.Primary, { maxWidth: 300, maxHeight: 300 })

const PLACEHOLDERS = { artist: 'music.mic', album: 'square.stack', playlist: 'music.note.list' }

function row(kind: 'artist' | 'album' | 'playlist', item: BaseItemDto): CarPlayListItem {
	const id = `${kind}:${item.Id}`
	return {
		id,
		title: item.Name ?? '',
		subtitle: kind === 'album' ? (item.AlbumArtist ?? undefined) : undefined,
		image: cover(item) ?? PLACEHOLDERS[kind],
		template: opens(id, item.Name ?? ''),
	}
}

const message = (title: string): CarPlayListItem => ({ id: `message:${title}`, title })

const retry = (): CarPlayListItem => ({
	id: RETRY_ID,
	title: "Couldn't reach your Jellyfin server",
	subtitle: 'Tap to try again',
	image: 'arrow.clockwise',
})

const problem = (error: { response?: { status?: number } } | undefined) =>
	error?.response?.status === 401 ? message('Sign in again in Jellify on your phone') : retry()

// Tracks only play from a PlayerQueue playlist; build one per list, replacing the previous copy afterwards
async function carPlaylist(key: string, tracks: TrackItem[]) {
	const name = `${AA_PLAYLIST_NAME_PREFIX}${key}`
	const { currentPlaylistId } = await TrackPlayer.getState()
	const previous = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name === name && p.id !== currentPlaylistId,
	)
	const playlistId = await PlayerQueue.createPlaylist(name)
	await PlayerQueue.addTracksToPlaylist(playlistId, tracks)
	await Promise.all(previous.map((p) => PlayerQueue.deletePlaylist(p.id)))
	return { playlistId, tracks }
}

async function playableTracks(key: string, found: TrackItem[]): Promise<CarPlayListSection[]> {
	if (found.length === 0) return [{ items: [message('Nothing here yet')] }]
	const { playlistId, tracks } = await carPlaylist(key, found)
	return [
		{
			items: tracks.map((track, index) => ({
				id: `${playlistId}:${index}`,
				title: track.title,
				subtitle: track.artist,
				image: track.artwork ?? 'music.note',
				playlistId,
				trackId: track.id,
			})),
		},
	]
}

async function toTracks(items: BaseItemDto[]) {
	return mapDtosToTracks(
		items.filter((item) => item.Type === BaseItemKind.Audio),
		await ensureDownloadedTracks(),
	)
}

async function playableItems(key: string, items: BaseItemDto[]) {
	return playableTracks(key, await toTracks(items))
}

// Read from the device, so it works without a connection
async function downloadedTracks(): Promise<TrackItem[]> {
	const downloads = await DownloadManager.getAllDownloadedTracks()
	return downloads
		.sort((a, b) => b.downloadedAt - a.downloadedAt)
		.map((download) => ({
			...download.originalTrack,
			url: `file://${download.localPath}`,
			artwork: download.localArtworkPath
				? `file://${download.localArtworkPath}`
				: download.originalTrack.artwork,
		}))
}

async function getItems(params: Parameters<ReturnType<typeof getLibraryApi>['getItems']>[0]) {
	const { data } = await getLibraryApi(getApi()!).getItems({
		userId: getUser()?.id,
		enableUserData: true,
		...params,
	})
	return data.Items ?? []
}

function favoriteTracks(musicLibraryId: string | undefined) {
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

// "More" keeps long lists within the car's item limit
function withMore(base: string, offset: number, items: CarPlayListItem[]): CarPlayListSection[] {
	if (items.length <= PAGE_SIZE) return [{ items }]
	const more = `${base}@${offset + PAGE_SIZE}`
	return [
		{
			items: [
				...items.slice(0, PAGE_SIZE),
				{ id: more, title: 'More…', template: opens(more, titles.get(base) ?? '') },
			],
		},
	]
}

// Song artwork wrapping like a grid; a song plays with the rest of the list after it
async function songTiles(
	id: string,
	title: string,
	items: BaseItemDto[],
): Promise<CarPlayImageRow | undefined> {
	const found = await toTracks(items)
	if (found.length === 0) return undefined
	const { playlistId, tracks } = await carPlaylist(`home:${id}`, found)
	titles.set(id, title)
	return {
		type: 'imageRow',
		id,
		title,
		multipleLines: true,
		elements: tracks.slice(0, TILES).map((track, index) => ({
			id: `${playlistId}:${index}`,
			image: track.artwork ?? 'music.note',
			title: track.title,
			subtitle: track.artist,
			playlistId,
			trackId: track.id,
		})),
	}
}

function albumTiles(items: BaseItemDto[]): CarPlayImageRow | undefined {
	const albums = items.filter((item) => item.Type === BaseItemKind.MusicAlbum)
	if (albums.length === 0) return undefined
	titles.set('added', 'Recently added')
	return {
		type: 'imageRow',
		id: 'added',
		title: 'Recently added',
		multipleLines: true,
		elements: albums.slice(0, TILES).map((album) => ({
			id: `album:${album.Id}`,
			image: cover(album) ?? PLACEHOLDERS.album,
			title: album.Name ?? '',
			subtitle: album.AlbumArtist ?? undefined,
			template: opens(`album:${album.Id}`, album.Name ?? ''),
		})),
	}
}

// Artwork grids from the server, then shortcuts that also work offline
async function home(
	api: NonNullable<ReturnType<typeof getApi>>,
	user: NonNullable<ReturnType<typeof getUser>>,
	library: ReturnType<typeof getLibrary>,
): Promise<CarPlayListSection[]> {
	const [results, downloads] = await Promise.all([
		Promise.allSettled([
			fetchRecentlyPlayed(api, user, library, 0).then((items) =>
				songTiles('picks:recents', 'Play it again', items),
			),
			fetchFrequentlyPlayed(api, library, 0).then((items) =>
				songTiles('picks:frequents', 'On Repeat', items),
			),
			fetchRecentlyAdded(api, library, 0).then(albumTiles),
		]),
		DownloadManager.getAllDownloadedTracks().catch(() => []),
	])
	const tiles = results.flatMap((result) =>
		result.status === 'fulfilled' && result.value ? [result.value] : [],
	)
	const failure = results.find((result) => result.status === 'rejected')
	const shortcuts: CarPlayListItem[] = [
		{
			id: 'picks:favorites',
			title: 'Favorites',
			image: 'heart.fill',
			template: opens('picks:favorites', 'Favorites'),
		},
	]
	if (downloads.length > 0)
		shortcuts.push({
			id: 'picks:downloads',
			title: 'Downloads',
			subtitle: `${downloads.length} song${downloads.length === 1 ? '' : 's'}`,
			image: 'arrow.down.circle.fill',
			template: opens('picks:downloads', 'Downloads'),
		})
	const sections: CarPlayListSection[] = []
	if (tiles.length > 0) sections.push({ items: tiles })
	else if (failure) sections.push({ items: [problem(failure.reason)] })
	sections.push({ header: 'Your library', items: shortcuts })
	return sections
}

async function load(templateId: string): Promise<CarPlayListSection[]> {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()
	if (!api || !user) return [{ items: [message('Open Jellify on your phone to sign in')] }]

	const [base, offsetText] = templateId.split('@')
	const offset = Number(offsetText) || 0
	const separator = base.indexOf(':')
	const kind = separator < 0 ? base : base.slice(0, separator)
	const id = separator < 0 ? '' : base.slice(separator + 1)
	const musicLibraryId = library?.musicLibraryId
	const page = { startIndex: offset, limit: PAGE_SIZE + 1 }

	switch (kind) {
		case 'home':
			return home(api, user, library)
		case 'added': {
			const albums = (await fetchRecentlyAdded(api, library, 0)).filter(
				(item) => item.Type === BaseItemKind.MusicAlbum,
			)
			if (albums.length === 0) return [{ items: [message('Nothing here yet')] }]
			return [{ items: albums.map((album) => row('album', album)) }]
		}
		case 'artists':
		case 'albums':
			if (!id)
				return [
					{
						items: LETTERS.map((letter) => ({
							id: `${kind}:${letter}`,
							title: letter,
							template: opens(`${kind}:${letter}`, letter),
						})),
					},
				]
			return withMore(
				base,
				offset,
				kind === 'artists'
					? (
							await getItems({
								parentId: musicLibraryId,
								includeItemTypes: [BaseItemKind.MusicArtist],
								sortBy: [ItemSortBy.SortName],
								sortOrder: [SortOrder.Ascending],
								enableImages: true,
								...page,
								...byLetter(id),
							})
						).map((artist) => row('artist', artist))
					: (
							await getItems({
								parentId: musicLibraryId,
								includeItemTypes: [BaseItemKind.MusicAlbum],
								recursive: true,
								sortBy: [ItemSortBy.SortName],
								...page,
								...byLetter(id),
							})
						).map((album) => row('album', album)),
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
				).map((album) => row('album', album)),
			)
		case 'playlists':
			return withMore(
				base,
				offset,
				(await refreshUserPlaylists())
					.slice(offset, offset + PAGE_SIZE + 1)
					.map((playlist) => row('playlist', playlist)),
			)
		case 'album':
			return playableItems(
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
			return playableItems(base, await refreshPlaylistTracks({ Id: id }))
		case 'picks':
			if (id === 'downloads') return playableTracks(base, await downloadedTracks())
			return playableItems(
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

// The car shows whatever comes back, so errors become rows rather than an empty screen
async function loadTemplate(templateId: string): Promise<CarPlayTemplate> {
	const sections = await load(templateId).catch((error): CarPlayListSection[] => {
		console.warn('CarPlay: request failed', error)
		return [{ items: [problem(error)] }]
	})
	return { type: 'list', id: templateId, title: titles.get(templateId) ?? '', sections }
}

/** Deletes car playlists from earlier sessions, keeping the one that may be playing. */
async function deleteStaleCarPlaylists(): Promise<void> {
	const { currentPlaylistId } = await TrackPlayer.getState()
	const stale = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name.startsWith(AA_PLAYLIST_NAME_PREFIX) && p.id !== currentPlaylistId,
	)
	await Promise.all(stale.map((p) => PlayerQueue.deletePlaylist(p.id).catch(() => undefined)))
}

let isRegistered = false

/** Loads the open CarPlay lists again, keeping what is on screen until the new content arrives. */
export function refreshCarPlayLibrary(templateId?: string): void {
	if (isRegistered) CarPlayHelper.reload(templateId)
}

/**
 * Registers the CarPlay templates. react-native-nitro-player keeps them across launches
 * and starts JS when the car connects, so the car can start Jellify with the app closed.
 *
 * @returns A clean-up function
 */
export function registerCarPlayService() {
	if (Platform.OS !== 'ios' || !CarPlayHelper.isAvailable() || isRegistered) return () => {}
	isRegistered = true

	CarPlayHelper.set({ templates: TABS, nowPlaying: { upNextTitle: 'Queue', albumArtist: true } })
	CarPlayHelper.setTemplateLoader(loadTemplate)
	CarPlayHelper.onSelect((id, templateId) => {
		if (id === RETRY_ID) CarPlayHelper.reload(templateId)
		// The title of an artwork row on Home opens its whole list
		else if (id.startsWith('picks:') || id === 'added')
			CarPlayHelper.push(opens(id, titles.get(id) ?? ''))
	})
	CarPlayHelper.onAlbumArtistPress((track) => {
		const item = getTrackDto(track)
		const artist = item?.ArtistItems?.[0]
		if (item?.AlbumId) CarPlayHelper.push(opens(`album:${item.AlbumId}`, track.album ?? ''))
		else if (artist?.Id) CarPlayHelper.push(opens(`artist:${artist.Id}`, artist.Name ?? ''))
	})

	const unsubscribeConnection = CarPlayHelper.onConnectionChange((connected) =>
		useAutoStore.getState().setIsConnected(connected),
	)
	useAutoStore.getState().setIsConnected(CarPlayHelper.isConnected())

	// Failed or signed-out lists recover on their own once the cause goes away
	let wasReachable = true
	const unsubscribeNetInfo = NetInfo.addEventListener(({ isInternetReachable }) => {
		if (isInternetReachable === false) wasReachable = false
		else if (isInternetReachable && !wasReachable) {
			wasReachable = true
			refreshCarPlayLibrary()
		}
	})
	const unsubscribeStore = useJellifyStore.subscribe((state, previous) => {
		if (
			state.user !== previous.user ||
			state.server !== previous.server ||
			state.library !== previous.library
		)
			refreshCarPlayLibrary()
	})

	deleteStaleCarPlaylists()

	return () => {
		unsubscribeConnection()
		unsubscribeNetInfo()
		unsubscribeStore()
	}
}
