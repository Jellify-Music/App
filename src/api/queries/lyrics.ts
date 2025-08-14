import { Api } from '@jellyfin/sdk/lib/api'
import { isEmpty, isUndefined } from 'lodash'
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api'
import { LyricsApi } from '@jellyfin/sdk/lib/generated-client/api/lyrics-api'

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
): Promise<string | undefined> {
	if (isUndefined(api)) throw new Error('Client not initialized')
	if (isEmpty(itemId)) throw new Error('No item ID provided')

	try {
		// Jellyfin LyricsApi returns plain text (often LRC) for the given item
		// SDK: LyricsApi.getLyrics({ itemId })
		const lyricsApi: LyricsApi = getLyricsApi(api)
		const { data } = await lyricsApi.getLyrics({ itemId })

		// Some SDK versions may wrap text; defensively unwrap
		if (typeof data === 'string') return data
		if (data && typeof (data as unknown as { Lyrics?: string }).Lyrics === 'string') {
			return (data as unknown as { Lyrics?: string }).Lyrics
		}
		return undefined
	} catch (e) {
		console.warn('Failed to fetch lyrics', e)
		return undefined
	}
}

/**
 * Parse (basic) LRC formatted lyrics text into timestamped lines.
 * Falls back to splitting by newline if no timestamps present.
 */
export function parseLrc(lrc: string | undefined): ParsedLyricLine[] {
	if (!lrc) return []
	const lines = lrc.split(/\r?\n/)
	const parsed: ParsedLyricLine[] = []
	lines.forEach((raw) => {
		const matches = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,2}))?]/g)]
		if (matches.length === 0) {
			// No time tag, push with NaN to preserve ordering (will be filtered later)
			parsed.push({ time: NaN, text: raw.trim() })
			return
		}
		const text = raw.replace(/^(?:\[[^\]]+])+/, '').trim()
		matches.forEach((m) => {
			const min = parseInt(m[1] ?? '0', 10)
			const sec = parseInt(m[2] ?? '0', 10)
			const frac = parseInt(m[3] ?? '0', 10)
			const time = min * 60 + sec + (isNaN(frac) ? 0 : frac / 100)
			parsed.push({ time, text })
		})
	})

	const withTime = parsed.filter((l) => !isNaN(l.time))
	if (withTime.length === 0) {
		// No timestamps, create evenly spaced pseudo-times
		return parsed
			.filter((l) => l.text.length > 0)
			.map((l, i) => ({ time: i * 5, text: l.text }))
	}
	return withTime.sort((a, b) => a.time - b.time)
}
