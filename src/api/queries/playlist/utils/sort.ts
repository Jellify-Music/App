import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Sorts playlists by when they were last updated, most recent first,
 * falling back to their names
 *
 * Jellyfin can't sort playlists by this server side, so it's done here
 */
export function sortPlaylistsByLastUpdated(playlists: BaseItemDto[]): BaseItemDto[] {
	return [...playlists].sort(
		(a, b) =>
			getLastUpdated(b) - getLastUpdated(a) ||
			(a.SortName ?? a.Name ?? '').localeCompare(b.SortName ?? b.Name ?? ''),
	)
}

/**
 * When a playlist was last updated, for sorting
 *
 * Jellyfin bumps `DateLastMediaAdded` whenever tracks are added to a playlist,
 * so fall back to `DateCreated` for playlists that haven't had tracks added yet
 */
function getLastUpdated(playlist: BaseItemDto): number {
	const date = playlist.DateLastMediaAdded ?? playlist.DateCreated
	return date ? Date.parse(date) : 0
}
