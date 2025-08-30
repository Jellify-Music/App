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
 */
export async function fetchRawLyrics(
	api: Api | undefined,
	itemId: string,
): Promise<LyricDto['Lyrics'] | undefined> {
	if (isUndefined(api)) throw new Error('Client not initialized')
	if (isEmpty(itemId)) throw new Error('No item ID provided')

	console.log('itemId', itemId)

	try {
		// Jellyfin LyricsApi returns plain text (often LRC) for the given item
		// SDK: LyricsApi.getLyrics({ itemId })
		const lyricsApi: LyricsApi = getLyricsApi(api)
		console.log('lyricsApi', lyricsApi)
		const { data } = await lyricsApi.getLyrics({ itemId })
		console.log('data', data)

		// Some SDK versions may wrap text; defensively unwrap
		return data.Lyrics
	} catch (e) {
		console.warn('Failed to fetch lyrics', e)
		return undefined
	}
}
