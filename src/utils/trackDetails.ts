import JellifyTrack from '@/src/types/JellifyTrack'

export function isExplicit(nowPlaying: JellifyTrack | undefined) {
	if (!nowPlaying) return false
	const ADULT_RATINGS = new Set([
		'R',
		'NC-17',
		'TV-MA',
		'TV-MA-L',
		'TV-MA-S',
		'TV-MA-V',
		'TV-MA-LS',
		'TV-MA-LV',
		'TV-MA-SV',
		'TV-MA-LSV',
		'TV-X',
		'TV-AO',
		'21',
		'XXX',
		'Banned',
	])

	function normalizeRating(rating?: string | null): string {
		return (rating ?? '').trim().toUpperCase().replace(/\s+/g, '') // e.g. "TV-MA L" -> "TV-MAL" (rare, but seen in messy data)
	}

	/**
	 * Checks whether a Jellyfin item should be treated as "explicit/adult"
	 * based on its rating string.
	 *
	 * Pass item.OfficialRating primarily; optionally fall back to other fields.
	 */
	function isExplicitByRating(rating?: string | null): boolean {
		const r = normalizeRating(rating)

		if (!r) return false

		// Try exact match first
		if (ADULT_RATINGS.has(r)) return true

		// Some servers/providers may return a base like "TV-MA" without suffixes,
		// or include extra suffixes beyond your list (e.g. "TV-MA-D")
		if (r.startsWith('TV-MA')) return true

		// Rare variants
		if (r === 'X' || r === 'AO') return true

		return false
	}

	return isExplicitByRating(
		nowPlaying?.item?.OfficialRating ||
			nowPlaying?.OfficialRating ||
			nowPlaying?.item?.CustomRating ||
			nowPlaying?.CustomRating,
	)
}
