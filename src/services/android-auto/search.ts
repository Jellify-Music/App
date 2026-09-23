import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { fetchSearchResults } from '../../api/queries/search/utils'
import { getLibrary } from '../../stores/auth/utils'
import { formatArtistName, formatArtistNames } from '../../utils/formatting/artist-names'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import { artworkUri } from './artwork'
import { playlistFor, trackRows } from './library'
import {
	AaMediaItem,
	AaMessages,
	ALBUM_PREFIX,
	ARTIST_PREFIX,
	PLAYLIST_PREFIX,
	folderItem,
	hasId,
	messageItem,
} from './tree'

/** Most songs offered for one query; the rest of the matches stay on the phone. */
export const SEARCH_TRACK_CAP = 50

/** Most artists, albums or playlists offered for one query. */
export const SEARCH_GROUP_CAP = 20

/** Comparable form of a name: no diacritics, no case, no surrounding space. */
const normalize = (name: string | null | undefined): string =>
	(name ?? '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * How well an item's name answers the query: whole name (3), start of the name (2),
 * one of its words (1), anything else the server matched (0).
 */
export function matchScore(name: string | null | undefined, query: string): number {
	const target = normalize(name)
	const wanted = normalize(query)
	if (!target || !wanted) return 0
	if (target === wanted) return 3
	if (target.startsWith(wanted)) return 2
	return target.split(/\s+/).some((word) => word.startsWith(wanted)) ? 1 : 0
}

/** Best match first, keeping the server's order between equally good matches. */
const byScore = (items: BaseItemDto[], query: string): BaseItemDto[] =>
	items
		.map((item, index) => ({ item, index, score: matchScore(item.Name, query) }))
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.map(({ item }) => item)

const artistRow = (artist: BaseItemDto): AaMediaItem => ({
	...folderItem(`${ARTIST_PREFIX}${artist.Id}`, formatArtistName(artist.Name), []),
	iconUrl: artworkUri(artist),
	groupTitle: 'Artists',
})

const albumRow = (album: BaseItemDto): AaMediaItem => ({
	...folderItem(
		`${ALBUM_PREFIX}${album.Id}`,
		album.Name ?? 'Untitled Album',
		[],
		album.AlbumArtist ?? formatArtistNames(album.Artists),
	),
	iconUrl: artworkUri(album),
	groupTitle: 'Albums',
})

const playlistRow = (playlist: BaseItemDto): AaMediaItem => ({
	...folderItem(`${PLAYLIST_PREFIX}${playlist.Id}`, playlist.Name ?? 'Untitled Playlist', []),
	iconUrl: artworkUri(playlist),
	groupTitle: 'Playlists',
})

/** Groups in the order they are shown when nothing matches better than anything else. */
const GROUPS = [
	{ type: BaseItemKind.MusicArtist, cap: SEARCH_GROUP_CAP, row: artistRow },
	{ type: BaseItemKind.MusicAlbum, cap: SEARCH_GROUP_CAP, row: albumRow },
	{ type: BaseItemKind.Playlist, cap: SEARCH_GROUP_CAP, row: playlistRow },
] as const

/**
 * Answers an Android Auto search: artists, albums and playlists open their usual pages,
 * songs play from one native playlist built for this query. Whole-name matches come first,
 * so "Abba" leads with the artist rather than a song that happens to mention it.
 *
 * The search runs against Jellyfin, so it finds music that was never browsed in the car.
 */
export async function searchLibrary(query: string): Promise<AaMediaItem[]> {
	const wanted = query.trim()
	if (!wanted) return []

	const startedAt = Date.now()
	try {
		const results = (await fetchSearchResults(getLibrary()?.musicLibraryId, wanted)).filter(
			hasId,
		)

		// A group's best match decides where it goes: "Abba" leads with the artist, while
		// "Dancing Queen" leads with the song. Groups matching equally well keep GROUPS order.
		const groups = GROUPS.map(({ type, cap, row }, order) => {
			const items = byScore(
				results.filter((item) => item.Type === type),
				wanted,
			).slice(0, cap)
			return { order, score: matchScore(items[0]?.Name, wanted), rows: items.map(row) }
		})

		const tracks = byScore(
			results.filter((item) => item.Type === BaseItemKind.Audio),
			wanted,
		).slice(0, SEARCH_TRACK_CAP)

		if (tracks.length > 0) {
			const playlistId = await playlistFor(
				`search:${normalize(wanted)}`,
				`Search: ${wanted}`,
				tracks,
			)
			if (playlistId)
				groups.push({
					order: GROUPS.length,
					score: matchScore(tracks[0].Name, wanted),
					rows: trackRows(playlistId, tracks).map((row) => ({
						...row,
						groupTitle: 'Songs',
					})),
				})
		}

		const rows = groups
			.filter((group) => group.rows.length > 0)
			.sort((a, b) => b.score - a.score || a.order - b.order)
			.flatMap((group) => group.rows)

		captureInfo(
			LoggingContext.AndroidAuto,
			`Search: ${rows.length} results in ${Date.now() - startedAt}ms`,
		)

		return rows.length > 0 ? rows : [messageItem('aa-search-empty', AaMessages.NoResults)]
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Search failed')
		return [messageItem('aa-search-error', AaMessages.ServerUnreachable)]
	}
}
