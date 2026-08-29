import { Api } from '@jellyfin/sdk/lib/api'
import { isEmpty, isUndefined } from 'lodash'
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api'
import { LyricsApi } from '@jellyfin/sdk/lib/generated-client/api/lyrics-api'
import { LyricDto } from '@jellyfin/sdk/lib/generated-client/models'

export interface ParsedLyricLine {
	time: number // seconds
	text: string
}

/**
 * Fetch raw lyrics text for a given track item.
 *
 * Resolves to `null` when the track has no lyrics. TanStack Query rejects
 * `undefined` as a query result, so returning it logs "Query data cannot be
 * undefined" and leaves the query permanently unresolved.
 */
export async function fetchRawLyrics(
	api: Api | undefined,
	itemId: string,
	signal?: AbortSignal,
): Promise<NonNullable<LyricDto['Lyrics']> | null> {
	if (isUndefined(api)) throw new Error('Client not initialized')
	if (isEmpty(itemId)) throw new Error('No item ID provided')

	try {
		// Jellyfin LyricsApi returns plain text (often LRC) for the given item
		// SDK: LyricsApi.getLyrics({ itemId })
		const lyricsApi: LyricsApi = getLyricsApi(api)
		const { data } = await lyricsApi.getLyrics({ itemId }, { signal })

		// Some SDK versions may wrap text; defensively unwrap.
		// Tracks without lyrics come back with no Lyrics field at all.
		return data.Lyrics ?? null
	} catch (e) {
		console.warn('Failed to fetch lyrics', e)
		return null
	}
}
