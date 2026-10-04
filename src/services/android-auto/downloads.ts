import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { groupAlphabetically } from '../../utils/grouping/alphabetical'
import { AA_MAX_FLAT_ITEMS } from './tree'

export type DownloadGroup = {
	id: string
	name: string
	subtitle?: string
	tracks: BaseItemDto[]
}

const byName = (a: string | null | undefined, b: string | null | undefined) =>
	(a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' })

/** Album name, then disc number, then track number. */
const byAlbumOrder = (a: BaseItemDto, b: BaseItemDto) =>
	byName(a.Album, b.Album) ||
	(a.ParentIndexNumber ?? 0) - (b.ParentIndexNumber ?? 0) ||
	(a.IndexNumber ?? 0) - (b.IndexNumber ?? 0)

const artistName = (track: BaseItemDto) =>
	track.AlbumArtist || track.ArtistItems?.[0]?.Name || track.Artists?.[0] || 'Unknown Artist'

function groupInto(
	tracks: BaseItemDto[],
	key: (track: BaseItemDto) => string,
	name: (track: BaseItemDto) => string,
	subtitle?: (track: BaseItemDto) => string | undefined,
): DownloadGroup[] {
	const groups = new Map<string, DownloadGroup>()

	for (const track of tracks) {
		const id = key(track)
		const group = groups.get(id) ?? {
			id,
			name: name(track),
			subtitle: subtitle?.(track),
			tracks: [],
		}
		group.tracks.push(track)
		groups.set(id, group)
	}

	return Array.from(groups.values())
		.map((group) => ({ ...group, tracks: [...group.tracks].sort(byAlbumOrder) }))
		.sort((a, b) => byName(a.name, b.name))
}

export const groupDownloadedAlbums = (tracks: BaseItemDto[]): DownloadGroup[] =>
	groupInto(
		tracks,
		(track) => track.AlbumId ?? `album:${track.Album ?? ''}`,
		(track) => track.Album ?? 'Unknown Album',
		(track) => track.AlbumArtist ?? undefined,
	)

export const groupDownloadedArtists = (tracks: BaseItemDto[]): DownloadGroup[] =>
	groupInto(tracks, artistName, artistName)

/** One "All songs" group when small, otherwise one group per first letter. */
export function groupDownloadedSongs(tracks: BaseItemDto[]): DownloadGroup[] {
	if (tracks.length === 0) return []

	const sorted = [...tracks].sort((a, b) => byName(a.Name, b.Name))

	if (sorted.length <= AA_MAX_FLAT_ITEMS)
		return [{ id: 'all', name: 'All songs', tracks: sorted }]

	return groupAlphabetically(sorted, (track) => track.Name).map(({ letter, items }) => ({
		id: letter,
		name: letter,
		tracks: items,
	}))
}
