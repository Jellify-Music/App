import type { MediaItem, MediaLibrary } from 'react-native-nitro-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { formatArtistNames } from '../../utils/formatting/artist-names'
import { artworkUri } from './artwork'
import { OTHER_BUCKET, groupAlphabetically } from '../../utils/grouping/alphabetical'

/**
 * Native playlists we materialize for Android Auto are tagged with this prefix so
 * `clearPlaylists` leaves them alone when the user starts a new queue on the phone.
 */
export const AA_PLAYLIST_NAME_PREFIX = 'jellify-aa:'

/**
 * nitro's `MediaItem` plus the Android Auto group header its native side reads from the
 * JSON (`DESCRIPTION_EXTRAS_KEY_CONTENT_STYLE_GROUP_TITLE`). Contiguous items with the same
 * `groupTitle` render under one header.
 */
export type AaMediaItem = MediaItem & { groupTitle?: string }

/** Lists longer than this are split into A–Z folders so a car screen never scrolls hundreds of rows. */
export const AA_MAX_FLAT_ITEMS = 50

export const AaIds = {
	Home: 'aa-home',
	PlayItAgain: 'aa-play-it-again',
	OnRepeat: 'aa-on-repeat',
	Favorites: 'aa-favorites',
	Shuffle: 'aa-shuffle',
	Playlists: 'aa-playlists',
	Downloads: 'aa-downloads',
	DownloadedArtists: 'aa-dl-artists',
	DownloadedAlbums: 'aa-dl-albums',
	DownloadedSongs: 'aa-dl-songs',
	LibraryArtists: 'aa-lib-artists',
	LibraryAlbums: 'aa-lib-albums',
} as const

export const AaMessages = {
	Loading: 'Loading…',
	SignIn: 'Open Jellify on your phone to sign in',
	ServerUnreachable: 'Unable to reach Jellyfin server',
	NoRecents: 'Nothing played yet',
	NoPlaylists: 'No playlists yet. Create one on your phone',
	NoDownloads: 'No downloaded music',
	DownloadsUnavailable: 'Downloads unavailable',
	NoArtists: 'No artists found',
	NoAlbums: 'No albums found',
	NoTracks: 'No tracks found',
	NoResults: 'No matching music found',
} as const

/** Lazy library pages, resolved by `loadLibraryChildren`. */
export const ARTIST_PREFIX = 'aa-lib-artist:'
export const ALBUM_PREFIX = 'aa-lib-album:'
export const PLAYLIST_PREFIX = 'aa-lib-playlist:'

/** Most albums in each Home section. */
export const MAX_HOME_SECTION_ITEMS = 12

/** A–Z buckets for on-demand library browsing; `#` groups everything sorted before "A". */
export const LIBRARY_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']

/** A row that opens a native PlayerQueue playlist (its tracks are the playable rows). */
export type AaPlaylistRef = {
	id: string
	title: string
	playlistId: string
	subtitle?: string
	iconUrl?: string
}

export const folderItem = (
	id: string,
	title: string,
	children: AaMediaItem[],
	subtitle?: string,
): AaMediaItem => ({ id, title, subtitle, isPlayable: false, mediaType: 'folder', children })

/** A non-interactive status row (loading / empty / error). Android Auto renders it as an empty folder. */
export const messageItem = (id: string, title: string): AaMediaItem => folderItem(id, title, [])

export const playlistItem = ({
	id,
	title,
	playlistId,
	subtitle,
	iconUrl,
}: AaPlaylistRef): AaMediaItem => ({
	id,
	title,
	subtitle,
	iconUrl,
	isPlayable: false,
	mediaType: 'playlist',
	playlistId,
})

/**
 * A row that starts the playlist straight away, from its first track, rather than opening it:
 * the `playlistId:trackId` id is what the player plays from.
 */
export const playNowItem = (
	{ title, playlistId, subtitle, iconUrl }: AaPlaylistRef,
	firstTrackId: string,
): AaMediaItem => ({
	id: `${playlistId}:${firstTrackId}`,
	title,
	subtitle,
	iconUrl,
	isPlayable: true,
	mediaType: 'audio',
})

/** Flat list when small, otherwise one folder per first letter (`#` last). */
export function bucketed(idPrefix: string, refs: AaPlaylistRef[]): AaMediaItem[] {
	if (refs.length <= AA_MAX_FLAT_ITEMS) return refs.map(playlistItem)

	return groupAlphabetically(refs, (ref) => ref.title).map(({ letter, items }) =>
		folderItem(
			`${idPrefix}-${letter === OTHER_BUCKET ? 'other' : letter}`,
			letter,
			items.map(playlistItem),
			`${items.length}`,
		),
	)
}

type RemoteSection = { loading?: boolean; error?: boolean }

function withStatus(
	id: string,
	{ loading, error }: RemoteSection,
	rows: AaMediaItem[],
	emptyMessage: string,
): AaMediaItem[] {
	if (loading) return [messageItem(`${id}-loading`, AaMessages.Loading), ...rows]
	if (rows.length > 0) return rows
	return [messageItem(`${id}-status`, error ? AaMessages.ServerUnreachable : emptyMessage)]
}

/** A lazy album page (tracks load on open). */
export const albumFolder = (
	albumId: string,
	title: string,
	subtitle?: string,
	iconUrl?: string,
): AaMediaItem => ({ ...folderItem(`${ALBUM_PREFIX}${albumId}`, title, [], subtitle), iconUrl })

/** A lazy album page for an album DTO (callers skip DTOs without an `Id`). */
export const albumFolderFromDto = (album: BaseItemDto): AaMediaItem =>
	albumFolder(
		album.Id ?? '',
		album.Name ?? 'Untitled Album',
		album.AlbumArtist ?? formatArtistNames(album.Artists),
		artworkUri(album),
	)

/** Drops DTOs without an `Id`: their rows would open nothing. */
export const hasId = (item: BaseItemDto): boolean => !!item.Id

export type HomeInput = RemoteSection & {
	/** One tap plays random songs from the whole library; first in Quick picks. */
	shuffle?: AaMediaItem | null
	playItAgain: AaPlaylistRef | null
	onRepeat: AaPlaylistRef | null
	/** Favourite songs, as a Quick picks playlist. */
	favorites?: AaPlaylistRef | null
	recentlyPlayed?: AaMediaItem[]
	recentlyAdded?: AaMediaItem[]
	mostPlayed?: AaMediaItem[]
	/** The Downloads folder, shown as one tile at the end. */
	downloads: AaMediaItem
}

const QUICK_PICKS = 'Quick picks'

const grouped = (groupTitle: string, items: AaMediaItem[]): AaMediaItem[] =>
	items.map((item) => ({ ...item, groupTitle }))

export function buildHomeFolder({
	shuffle = null,
	playItAgain,
	onRepeat,
	favorites = null,
	recentlyPlayed = [],
	recentlyAdded = [],
	mostPlayed = [],
	downloads,
	...status
}: HomeInput): AaMediaItem {
	const section = (items: AaMediaItem[]) => items.slice(0, MAX_HOME_SECTION_ITEMS)
	const quickPicks = [
		...(shuffle ? [shuffle] : []),
		...[playItAgain, onRepeat, favorites]
			.filter((ref): ref is AaPlaylistRef => ref !== null)
			.map(playlistItem),
	]
	const rows = [
		...grouped(QUICK_PICKS, quickPicks),
		...grouped('Recently played albums', section(recentlyPlayed)),
		...grouped('Recently added', section(recentlyAdded)),
		...grouped('Most played albums', section(mostPlayed)),
	]

	return folderItem(AaIds.Home, 'Home', [
		// Status rows stand for the remote sections, so they sit under the first header.
		...withStatus(AaIds.Home, status, rows, AaMessages.NoRecents).map((row) =>
			row.groupTitle ? row : { ...row, groupTitle: QUICK_PICKS },
		),
		{ ...downloads, groupTitle: 'Downloads' },
	])
}

export type PlaylistsInput = RemoteSection & {
	playlists: AaPlaylistRef[]
	/** Favourite songs, listed first. */
	favorites?: AaPlaylistRef | null
}

/** Full-width rows, so long playlist names and status messages fit. */
export function buildPlaylistsFolder({
	playlists,
	favorites = null,
	...status
}: PlaylistsInput): AaMediaItem {
	const rows = [
		...(favorites ? [playlistItem(favorites)] : []),
		...bucketed(AaIds.Playlists, playlists),
	]
	return {
		...folderItem(
			AaIds.Playlists,
			'Playlists',
			withStatus(AaIds.Playlists, status, rows, AaMessages.NoPlaylists),
		),
		layoutType: 'list',
	}
}

export type DownloadsInput = {
	artists: AaPlaylistRef[]
	albums: AaPlaylistRef[]
	/** One "All songs" playlist, or one playlist per letter when there are many downloads. */
	songs: AaPlaylistRef[]
	/** Artwork for the Downloads tile. */
	iconUrl?: string
}

const downloadsFolder = (children: AaMediaItem[], iconUrl?: string): AaMediaItem => ({
	...folderItem(AaIds.Downloads, 'Downloads', children),
	iconUrl,
	layoutType: 'grid',
})

export function buildDownloadsFolder({
	artists,
	albums,
	songs,
	iconUrl,
}: DownloadsInput): AaMediaItem {
	if (songs.length === 0) {
		return downloadsFolder([messageItem(`${AaIds.Downloads}-status`, AaMessages.NoDownloads)])
	}

	return downloadsFolder(
		[
			folderItem(
				AaIds.DownloadedArtists,
				'Artists',
				bucketed(AaIds.DownloadedArtists, artists),
				`${artists.length}`,
			),
			folderItem(
				AaIds.DownloadedAlbums,
				'Albums',
				bucketed(AaIds.DownloadedAlbums, albums),
				`${albums.length}`,
			),
			songs.length === 1
				? playlistItem(songs[0])
				: folderItem(AaIds.DownloadedSongs, 'Songs', songs.map(playlistItem)),
		],
		iconUrl,
	)
}

export const buildDownloadsUnavailableFolder = (): AaMediaItem =>
	downloadsFolder([messageItem(`${AaIds.Downloads}-status`, AaMessages.DownloadsUnavailable)])

/** A lazily loaded tab (Artists / Albums): `loadLibraryChildren` fills it on open. */
const lazyTab = (id: string, title: string, layoutType: 'grid' | 'list'): AaMediaItem => ({
	...folderItem(id, title, []),
	layoutType,
})

/** The root tabs: Home · Artists · Albums · Playlists. */
export const buildRootLibrary = (home: AaMediaItem, playlists: AaMediaItem): MediaLibrary =>
	buildLibrary([
		home,
		lazyTab(AaIds.LibraryArtists, 'Artists', 'grid'),
		lazyTab(AaIds.LibraryAlbums, 'Albums', 'grid'),
		playlists,
	])

export const buildLibrary = (rootItems: AaMediaItem[]): MediaLibrary => ({
	layoutType: 'grid',
	appName: 'Jellify',
	rootItems,
})

export const buildSignedOutLibrary = (): MediaLibrary =>
	buildLibrary([messageItem('aa-sign-in', AaMessages.SignIn)])
