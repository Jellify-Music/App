import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Sorts playlists by name, since the user's playlists are cached
 * most recently updated first
 *
 * @param playlists The playlists to sort
 * @returns The playlists sorted by {@link BaseItemDto.SortName} or {@link BaseItemDto.Name}
 */
export function sortPlaylistsByName(playlists: BaseItemDto[]): BaseItemDto[] {
	return [...playlists].sort((a, b) =>
		(a.SortName ?? a.Name ?? '').localeCompare(b.SortName ?? b.Name ?? ''),
	)
}
