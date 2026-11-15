import { BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi } from '../../../stores/auth/utils'

/** What the Jellyfin server reports about an artist */
export interface ArtistInfo {
	bio: string
	genres: string[]
}

/**
 * Providers and NFO files sometimes store the biography as HTML: turn line breaks into new lines,
 * drop the other tags, and decode the common entities, so it reads as plain text
 */
export function toPlainText(text: string): string {
	return text
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

/** The artist's own biography and genres from the Jellyfin server, or null if it has no biography */
export async function fetchArtistInfo(
	artist: BaseItemDto,
	signal?: AbortSignal,
): Promise<ArtistInfo | null> {
	const api = getApi()
	if (!api || !artist.Id) return null

	const { data } = await getLibraryApi(api).getItems(
		{ ids: [artist.Id], fields: [ItemFields.Overview, ItemFields.Genres] },
		{ signal },
	)
	const item = data.Items?.[0]
	const bio = item?.Overview ? toPlainText(item.Overview) : undefined

	return bio ? { bio, genres: item?.Genres ?? [] } : null
}
