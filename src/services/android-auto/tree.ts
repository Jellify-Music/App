import type { MediaItem, MediaLibrary } from 'react-native-nitro-player'
import { OTHER_BUCKET, groupAlphabetically } from '../../utils/grouping/alphabetical'

/**
 * Native playlists we materialize for Android Auto are tagged with this prefix so
 * `clearPlaylists` leaves them alone when the user starts a new queue on the phone.
 */
export const AA_PLAYLIST_NAME_PREFIX = 'jellify-aa:'

/** Lists longer than this are split into A–Z folders so a car screen never scrolls hundreds of rows. */
export const AA_MAX_FLAT_ITEMS = 50

export const AaIds = {
	Home: 'aa-home',
	PlayItAgain: 'aa-play-it-again',
	OnRepeat: 'aa-on-repeat',
	Playlists: 'aa-playlists',
	Downloads: 'aa-downloads',
	DownloadedArtists: 'aa-dl-artists',
	DownloadedAlbums: 'aa-dl-albums',
	DownloadedSongs: 'aa-dl-songs',
} as const

export const AaMessages = {
	Loading: 'Loading…',
	SignIn: 'Open Jellify on your phone to sign in',
	ServerUnreachable: 'Unable to reach Jellyfin server',
	NoRecents: 'Nothing played yet',
	NoPlaylists: 'No playlists found',
	NoDownloads: 'No downloaded music',
	DownloadsUnavailable: 'Downloads unavailable',
} as const

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
	children: MediaItem[],
	subtitle?: string,
): MediaItem => ({ id, title, subtitle, isPlayable: false, mediaType: 'folder', children })

/** A non-interactive status row (loading / empty / error). Android Auto renders it as an empty folder. */
export const messageItem = (id: string, title: string): MediaItem => folderItem(id, title, [])

export const playlistItem = ({
	id,
	title,
	playlistId,
	subtitle,
	iconUrl,
}: AaPlaylistRef): MediaItem => ({
	id,
	title,
	subtitle,
	iconUrl,
	isPlayable: false,
	mediaType: 'playlist',
	playlistId,
})

/** Flat list when small, otherwise one folder per first letter (`#` last). */
export function bucketed(idPrefix: string, refs: AaPlaylistRef[]): MediaItem[] {
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
	rows: MediaItem[],
	emptyMessage: string,
): MediaItem[] {
	if (loading) return [messageItem(`${id}-loading`, AaMessages.Loading), ...rows]
	if (rows.length > 0) return rows
	return [messageItem(`${id}-status`, error ? AaMessages.ServerUnreachable : emptyMessage)]
}

export type HomeInput = RemoteSection & {
	playItAgain: AaPlaylistRef | null
	onRepeat: AaPlaylistRef | null
}

export function buildHomeFolder({ playItAgain, onRepeat, ...status }: HomeInput): MediaItem {
	const rows = [playItAgain, onRepeat]
		.filter((ref): ref is AaPlaylistRef => ref !== null)
		.map(playlistItem)
	return folderItem(
		AaIds.Home,
		'Home',
		withStatus(AaIds.Home, status, rows, AaMessages.NoRecents),
	)
}

export type PlaylistsInput = RemoteSection & { playlists: AaPlaylistRef[] }

export function buildPlaylistsFolder({ playlists, ...status }: PlaylistsInput): MediaItem {
	return folderItem(
		AaIds.Playlists,
		'Playlists',
		withStatus(
			AaIds.Playlists,
			status,
			bucketed(AaIds.Playlists, playlists),
			AaMessages.NoPlaylists,
		),
	)
}

export type DownloadsInput = {
	artists: AaPlaylistRef[]
	albums: AaPlaylistRef[]
	/** One "All songs" playlist, or one playlist per letter when there are many downloads. */
	songs: AaPlaylistRef[]
}

export function buildDownloadsFolder({ artists, albums, songs }: DownloadsInput): MediaItem {
	if (songs.length === 0) {
		return folderItem(AaIds.Downloads, 'Downloads', [
			messageItem(`${AaIds.Downloads}-status`, AaMessages.NoDownloads),
		])
	}

	return folderItem(AaIds.Downloads, 'Downloads', [
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
	])
}

export const buildDownloadsUnavailableFolder = (): MediaItem =>
	folderItem(AaIds.Downloads, 'Downloads', [
		messageItem(`${AaIds.Downloads}-status`, AaMessages.DownloadsUnavailable),
	])

export const buildLibrary = (rootItems: MediaItem[]): MediaLibrary => ({
	layoutType: 'list',
	appName: 'Jellify',
	rootItems,
})

export const buildSignedOutLibrary = (): MediaLibrary =>
	buildLibrary([messageItem('aa-sign-in', AaMessages.SignIn)])
