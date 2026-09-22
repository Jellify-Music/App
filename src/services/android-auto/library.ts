import {
	BaseItemDto,
	ImageType,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import type { MediaItem } from 'react-native-nitro-player'
import { fetchArtists } from '../../api/queries/artist/utils/artist'
import { ensureArtistAlbumsQueryData } from '../../api/queries/artist/queries'
import { fetchAlbums } from '../../api/queries/album/utils/album'
import { ensureAlbumDiscsQuery } from '../../api/queries/album'
import { getItemImageUrl } from '../../api/queries/image/utils'
import { NameFilter } from '../../api/queries/name-filter'
import { ApiLimits } from '../../configs/querying/index.config'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import { formatArtistName, formatArtistNames } from '../../utils/formatting/artist-names'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import { AaIds, AaMessages, messageItem } from './tree'
import { materializePlaylist } from './playlists'

const ARTISTS_LETTER_PREFIX = `${AaIds.LibraryArtists}:`
const ALBUMS_LETTER_PREFIX = `${AaIds.LibraryAlbums}:`
const ARTIST_PREFIX = 'aa-lib-artist:'
const ALBUM_PREFIX = 'aa-lib-album:'

// ponytail: a letter bucket beyond 500 entries is truncated rather than paged further;
// upgrade path is two-letter sub-buckets (e.g. "Aa", "Ab") if a library needs it.
const LIBRARY_LETTER_MAX_ITEMS = 500

/** Album id → materialized native PlayerQueue playlist id, reused while the app stays open. */
const albumPlaylists = new Map<string, string>()

/** Forgets every cached album→playlist id. Call on each publish: publish deletes AA playlists. */
export function clearLibraryPlaylists(): void {
	albumPlaylists.clear()
}

const letterFilter = (letter: string): NameFilter =>
	letter === '#' ? { nameLessThan: 'A' } : { nameStartsWith: letter }

/** Pages `fetchPage` until a short page or the {@link LIBRARY_LETTER_MAX_ITEMS} cap. */
async function pageAll<T>(fetchPage: (page: number) => Promise<T[]>): Promise<T[]> {
	const results: T[] = []
	let page = 0

	while (results.length < LIBRARY_LETTER_MAX_ITEMS) {
		const items = await fetchPage(page)
		results.push(...items)
		if (items.length < ApiLimits.Library) break
		page++
	}

	return results.slice(0, LIBRARY_LETTER_MAX_ITEMS)
}

const artistFolder = (artist: BaseItemDto): MediaItem => ({
	id: `${ARTIST_PREFIX}${artist.Id}`,
	title: formatArtistName(artist.Name),
	iconUrl: getItemImageUrl(artist, ImageType.Primary),
	isPlayable: false,
	mediaType: 'folder',
	children: [],
})

const albumFolder = (album: BaseItemDto): MediaItem => ({
	id: `${ALBUM_PREFIX}${album.Id}`,
	title: album.Name ?? 'Untitled Album',
	subtitle: album.AlbumArtist ?? undefined,
	iconUrl: getItemImageUrl(album, ImageType.Primary),
	isPlayable: false,
	mediaType: 'folder',
	children: [],
})

async function loadArtistLetter(parentId: string, letter: string): Promise<MediaItem[]> {
	const filter = letterFilter(letter)
	const artists = await pageAll((page) =>
		fetchArtists(
			getUser(),
			getLibrary(),
			page,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			filter,
		),
	)

	if (artists.length === 0) return [messageItem(`${parentId}-empty`, AaMessages.NoArtists)]
	return artists.map(artistFolder)
}

async function loadAlbumLetter(parentId: string, letter: string): Promise<MediaItem[]> {
	const filter = letterFilter(letter)
	const albums = await pageAll((page) =>
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
		),
	)

	if (albums.length === 0) return [messageItem(`${parentId}-empty`, AaMessages.NoAlbums)]
	return albums.map(albumFolder)
}

async function loadArtistAlbums(parentId: string, artistId: string): Promise<MediaItem[]> {
	const albums = await ensureArtistAlbumsQueryData({ Id: artistId })
	if (albums.length === 0) return [messageItem(`${parentId}-empty`, AaMessages.NoAlbums)]
	return albums.map(albumFolder)
}

async function loadAlbumTracks(parentId: string, albumId: string): Promise<MediaItem[]> {
	const discs = await ensureAlbumDiscsQuery({ Id: albumId })
	const tracks = discs.flatMap((disc) => disc.data)

	if (tracks.length === 0) return [messageItem(`${parentId}-empty`, 'No tracks found')]

	const playlistId =
		albumPlaylists.get(albumId) ??
		(await materializePlaylist(tracks[0]?.Album ?? 'Album', tracks))
	if (!playlistId) return [messageItem(`${parentId}-empty`, 'No tracks found')]
	albumPlaylists.set(albumId, playlistId)

	return tracks.map((track) => ({
		id: `${playlistId}:${track.Id}`,
		title: track.Name ?? 'Untitled Track',
		subtitle: formatArtistNames(track.Artists),
		isPlayable: true,
		mediaType: 'audio',
	}))
}

function route(parentId: string): Promise<MediaItem[]> {
	if (parentId.startsWith(ARTISTS_LETTER_PREFIX))
		return loadArtistLetter(parentId, parentId.slice(ARTISTS_LETTER_PREFIX.length))
	if (parentId.startsWith(ALBUMS_LETTER_PREFIX))
		return loadAlbumLetter(parentId, parentId.slice(ALBUMS_LETTER_PREFIX.length))
	if (parentId.startsWith(ARTIST_PREFIX))
		return loadArtistAlbums(parentId, parentId.slice(ARTIST_PREFIX.length))
	if (parentId.startsWith(ALBUM_PREFIX))
		return loadAlbumTracks(parentId, parentId.slice(ALBUM_PREFIX.length))
	return Promise.resolve([])
}

/**
 * Resolves the children Android Auto asked for when opening a Library folder that isn't
 * in the published tree (A–Z letter buckets, artists, albums). A fetch failure never
 * propagates — the bridge would otherwise answer `[]`, indistinguishable from an empty
 * folder — it becomes a "server unreachable" row instead.
 */
export async function loadLibraryChildren(parentId: string): Promise<MediaItem[]> {
	const startedAt = Date.now()
	try {
		const items = await route(parentId)
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
	}
}
