import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * What we remember about a playlist in order to tell which artists are on it, without
 * keeping all of its tracks around.
 */
export interface PlaylistArtistIndex {
	/** IDs of every track artist and album artist on the playlist */
	artistIds: string[]
}

/** Indexes a playlist by the artists of its tracks */
export function buildPlaylistArtistIndex(tracks: BaseItemDto[]): PlaylistArtistIndex {
	const artistIds = new Set<string>()

	tracks.forEach((track) =>
		[...(track.ArtistItems ?? []), ...(track.AlbumArtists ?? [])].forEach((artist) => {
			if (artist.Id) artistIds.add(artist.Id)
		}),
	)

	return { artistIds: [...artistIds] }
}

/**
 * A token that changes whenever the playlist's contents might have, used to tell when a cached
 * summary of the playlist is out of date.
 *
 * Jellyfin changes a playlist's `Etag` on any edit (adding, removing, reordering, swapping), for
 * both the user's own and library `.m3u` playlists. Without an `Etag`, falls back to the track
 * count, which misses same-size edits. Returns `undefined` when there's nothing to go on.
 */
export function playlistVersion(playlist: Pick<BaseItemDto, 'Etag' | 'ChildCount'>) {
	if (playlist.Etag) return `etag:${playlist.Etag}`

	if (playlist.ChildCount != null) return `count:${playlist.ChildCount}`

	return undefined
}

/**
 * One collator for every comparison: `localeCompare` with options builds a new collator on each
 * call in Hermes, which made sorting 10,000 playlists take seconds
 */
const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base' })

/**
 * The user's playlists and the public ones as one list, without duplicates, sorted by name.
 *
 * Empty playlists are kept: until Jellyfin has refreshed a library `.m3u` it reports no tracks for
 * it, so a count of zero doesn't mean the playlist is empty. Public playlists come back in random
 * order, hence the sort.
 */
export function mergePlaylists(
	userPlaylists: BaseItemDto[] | undefined,
	publicPlaylists: BaseItemDto[] | undefined,
): BaseItemDto[] {
	const byId = new Map<string, BaseItemDto>()

	for (const playlist of [...(userPlaylists ?? []), ...(publicPlaylists ?? [])]) {
		if (playlist.Id && !byId.has(playlist.Id)) byId.set(playlist.Id, playlist)
	}

	return [...byId.values()].sort((a, b) => nameCollator.compare(a.Name ?? '', b.Name ?? ''))
}

/**
 * The version a playlist's summary is stored under. A playlist reporting neither an `Etag` nor a
 * count can't be told apart from an edited one, so it's summarised once and left at that.
 */
export const summaryVersion = (playlist: Pick<BaseItemDto, 'Etag' | 'ChildCount'>): string =>
	playlistVersion(playlist) ?? 'unknown'
