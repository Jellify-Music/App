import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { fetchArtists } from '../../api/queries/artist/utils/artist'
import { ensureArtistAlbumsQueryData } from '../../api/queries/artist/queries'
import { fetchAlbums } from '../../api/queries/album/utils/album'
import { ensureAlbumDiscsQuery } from '../../api/queries/album'
import { NameFilter } from '../../api/queries/name-filter'
import { artworkUri, letterArtworkUri } from './artwork'
import { ApiLimits } from '../../configs/querying/index.config'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import { firstLetterBucket } from '../../utils/grouping/alphabetical'
import { formatArtistName, formatArtistNames } from '../../utils/formatting/artist-names'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import {
	ALBUM_PREFIX,
	ARTIST_PREFIX,
	AaIds,
	AaMediaItem,
	AaMessages,
	LIBRARY_LETTERS,
	albumFolderFromDto,
	hasId,
	folderItem,
	messageItem,
} from './tree'
import { materializePlaylist } from './playlists'

// ponytail: a letter bucket beyond 500 entries is truncated rather than paged further;
// upgrade path is two-letter sub-buckets (e.g. "Aa", "Ab") if a library needs it.
const LIBRARY_LETTER_MAX_ITEMS = 500

// ponytail: binder budget — one browse result travels through a ~1 MB transaction buffer
// (MediaBrowserCompat's one-way Messenger path gets about half), and a row parcels to ~1 KB.
// A tab lists at most this many rows; above it → A–Z letter tiles.
export const FLAT_LIST_MAX = 500

/** How long Android Auto waits on the server before we answer with an error row. */
const LOAD_TIMEOUT_MS = 15_000

/** Ids of our own status rows (loading / empty / error); opening one shows nothing. */
const STATUS_ROW = /-(empty|error|loading|status)$/

/** Album id → materialized native PlayerQueue playlist id, reused while the app stays open. */
const albumPlaylists = new Map<string, string>()

/** Artists / Albums tab rows, loaded once per publish. */
const tabs = new Map<string, AaMediaItem[]>()

/** Forgets cached tabs and album→playlist ids (sign-out: nothing may outlive the session). */
export function clearLibraryCache(): void {
	albumPlaylists.clear()
	tabs.clear()
}

/**
 * Forgets cached tabs but keeps album playlists: Android Auto doesn't reload an album page it
 * already shows, so its rows must keep pointing at a playlist that still exists.
 */
export function clearLibraryTabs(): void {
	tabs.clear()
}

/** Native playlist ids of the album pages opened so far; a signed-in publish must keep them. */
export const albumPlaylistIds = (): Set<string> => new Set(albumPlaylists.values())

const letterFilter = (letter: string): NameFilter =>
	letter === '#' ? { nameLessThan: 'A' } : { nameStartsWith: letter }

/** Pages `fetchPage` until a short page or `max` items. */
async function pageAll<T>(max: number, fetchPage: (page: number) => Promise<T[]>): Promise<T[]> {
	const results: T[] = []
	let page = 0

	while (results.length < max) {
		const items = await fetchPage(page)
		results.push(...items)
		if (items.length < ApiLimits.Library) break
		page++
	}

	return results.slice(0, max)
}

const fetchArtistPage = (page: number, filter?: NameFilter) =>
	fetchArtists(
		getUser(),
		getLibrary(),
		page,
		undefined,
		[ItemSortBy.SortName],
		[SortOrder.Ascending],
		undefined,
		filter,
	)

const fetchAlbumPage = (page: number, filter?: NameFilter) =>
	fetchAlbums(
		getApi(),
		getUser(),
		getLibrary(),
		page,
		undefined,
		[ItemSortBy.SortName],
		[SortOrder.Ascending],
		undefined,
		undefined,
		undefined,
		filter,
	)

/** Artist row; its page shows album covers as a grid. */
const artistFolder = (artist: BaseItemDto): AaMediaItem => ({
	...folderItem(
		`${ARTIST_PREFIX}${artist.Id}`,
		formatArtistName(artist.Name),
		[],
		artist.Genres?.slice(0, 3).join(', ') || undefined,
	),
	iconUrl: artworkUri(artist),
	layoutType: 'grid',
})

/** List row under its letter header; relies on the server's SortName order to keep headers contiguous. */
const lettered =
	(toItem: (item: BaseItemDto) => AaMediaItem) =>
	(item: BaseItemDto): AaMediaItem => ({
		...toItem(item),
		groupTitle: firstLetterBucket(item.SortName ?? item.Name),
	})

type Section = {
	prefix: string
	fetchPage: (page: number, filter?: NameFilter) => Promise<BaseItemDto[]>
	toItem: (item: BaseItemDto) => AaMediaItem
	emptyMessage: string
	/** How the tab's rows render; matches the tab's own layoutType in the root tree. */
	layoutType: 'grid' | 'list'
	/** Open on A–Z letter tiles (one tap to a letter) instead of one long list. */
	letterTiles: boolean
}

const sections: Section[] = [
	{
		prefix: AaIds.LibraryArtists,
		fetchPage: fetchArtistPage,
		toItem: artistFolder,
		emptyMessage: AaMessages.NoArtists,
		layoutType: 'grid',
		letterTiles: true,
	},
	{
		prefix: AaIds.LibraryAlbums,
		fetchPage: fetchAlbumPage,
		toItem: albumFolderFromDto,
		emptyMessage: AaMessages.NoAlbums,
		layoutType: 'list',
		letterTiles: false,
	},
]

/** A–Z tile opening `${prefix}:${letter}`, drawn as a letter picture. */
const letterTile =
	({ prefix, layoutType }: Section) =>
	(letter: string): AaMediaItem => ({
		...folderItem(`${prefix}:${letter}`, letter, []),
		iconUrl: letterArtworkUri(letter),
		layoutType,
	})

/**
 * The tab's rows. Up to {@link FLAT_LIST_MAX} entries load at once: as one sorted list under
 * letter headers, or (`letterTiles`) as tiles for the letters in use, each letter's rows cached
 * so opening it needs no request. Above that, all 27 A–Z tiles, each letter loaded on open.
 */
async function loadTab(section: Section) {
	const { prefix, fetchPage, toItem, emptyMessage, letterTiles } = section
	const cached = tabs.get(prefix)
	if (cached) return cached

	const items = (await pageAll(FLAT_LIST_MAX + 1, (page) => fetchPage(page))).filter(hasId)
	let rows: AaMediaItem[]
	if (items.length === 0) {
		rows = [messageItem(`${prefix}-empty`, emptyMessage)]
	} else if (items.length > FLAT_LIST_MAX) {
		rows = LIBRARY_LETTERS.map(letterTile(section))
	} else if (letterTiles) {
		const byLetter = new Map<string, AaMediaItem[]>()
		for (const item of items) {
			const letter = firstLetterBucket(item.SortName ?? item.Name)
			byLetter.set(letter, [...(byLetter.get(letter) ?? []), toItem(item)])
		}
		byLetter.forEach((letterRows, letter) => tabs.set(`${prefix}:${letter}`, letterRows))
		rows = LIBRARY_LETTERS.filter((letter) => byLetter.has(letter)).map(letterTile(section))
	} else {
		rows = items.map(lettered(toItem))
	}

	tabs.set(prefix, rows)
	return rows
}

/** One letter's rows; the page title is already the letter, so no group header. */
async function loadLetter(
	{ prefix, fetchPage, toItem, emptyMessage }: Section,
	letter: string,
): Promise<AaMediaItem[]> {
	const cached = tabs.get(`${prefix}:${letter}`)
	if (cached) return cached

	const filter = letterFilter(letter)
	const items = (
		await pageAll(LIBRARY_LETTER_MAX_ITEMS, (page) => fetchPage(page, filter))
	).filter(hasId)

	if (items.length === 0) return [messageItem(`${prefix}:${letter}-empty`, emptyMessage)]
	return items.map(toItem)
}

/** The artist's albums, or straight to the songs when there is only one album. */
async function loadArtistAlbums(parentId: string, artistId: string): Promise<AaMediaItem[]> {
	const albums = (await ensureArtistAlbumsQueryData({ Id: artistId })).filter(hasId)
	if (albums.length === 0) return [messageItem(`${parentId}-empty`, AaMessages.NoAlbums)]
	if (albums.length === 1) return loadAlbumTracks(parentId, albums[0].Id!)
	return albums.map(albumFolderFromDto)
}

async function loadAlbumTracks(parentId: string, albumId: string): Promise<AaMediaItem[]> {
	const discs = await ensureAlbumDiscsQuery({ Id: albumId })
	const tracks = discs.flatMap((disc) => disc.data)

	if (tracks.length === 0) return [messageItem(`${parentId}-empty`, AaMessages.NoTracks)]

	const playlistId =
		albumPlaylists.get(albumId) ??
		(await materializePlaylist(tracks[0]?.Album ?? 'Album', tracks))
	if (!playlistId) return [messageItem(`${parentId}-empty`, AaMessages.NoTracks)]
	albumPlaylists.set(albumId, playlistId)

	return tracks.map((track) => ({
		id: `${playlistId}:${track.Id}`,
		title: track.Name ?? 'Untitled Track',
		subtitle: formatArtistNames(track.Artists),
		iconUrl: artworkUri(track),
		isPlayable: true,
		mediaType: 'audio',
	}))
}

function route(parentId: string): Promise<AaMediaItem[]> {
	if (STATUS_ROW.test(parentId)) return Promise.resolve([])

	for (const section of sections) {
		if (parentId === section.prefix) return loadTab(section)
		if (parentId.startsWith(`${section.prefix}:`)) {
			const letter = parentId.slice(section.prefix.length + 1)
			return LIBRARY_LETTERS.includes(letter)
				? loadLetter(section, letter)
				: Promise.resolve([])
		}
	}
	if (parentId.startsWith(ARTIST_PREFIX))
		return loadArtistAlbums(parentId, parentId.slice(ARTIST_PREFIX.length))
	if (parentId.startsWith(ALBUM_PREFIX))
		return loadAlbumTracks(parentId, parentId.slice(ALBUM_PREFIX.length))
	return Promise.resolve([])
}

/**
 * Resolves the children Android Auto asked for when opening a folder that isn't in the
 * published tree (Artists/Albums tabs, A–Z letter tiles, artist and album pages). A fetch
 * failure or a server that takes longer than 15 s never propagates — the bridge would
 * otherwise answer `[]`, indistinguishable from an empty folder — it becomes a
 * "server unreachable" row instead.
 */
export async function loadLibraryChildren(parentId: string): Promise<AaMediaItem[]> {
	const startedAt = Date.now()
	let timer: ReturnType<typeof setTimeout> | undefined
	try {
		const items = await Promise.race([
			route(parentId),
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error(`Timed out after ${LOAD_TIMEOUT_MS}ms`)),
					LOAD_TIMEOUT_MS,
				)
			}),
		])
		captureInfo(
			LoggingContext.AndroidAuto,
			`Library ${parentId}: ${items.length} items in ${Date.now() - startedAt}ms`,
		)
		return items
	} catch (error) {
		captureError(
			error,
			LoggingContext.AndroidAuto,
			`Failed to load library children for ${parentId}`,
		)
		return [messageItem(`${parentId}-error`, AaMessages.ServerUnreachable)]
	} finally {
		clearTimeout(timer)
	}
}
