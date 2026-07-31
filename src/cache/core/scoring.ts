import { CACHE_SCORE_HALF_LIFE_MS, CacheEntry } from './types'

/**
 * Hotness score: exponentially-decayed play frequency.
 *
 * Each completed play contributes `0.5 ^ (age / halfLife)`, so a play loses
 * half its weight every half-life. One formula yields both frequency and
 * recency behavior: a track played ten times last month decays below a track
 * played twice this week, with no separate LFU/LRU knobs to tune.
 *
 * Pure function of the entry and an explicit clock.
 */
export function scoreEntry(
	entry: CacheEntry,
	now: number,
	halfLifeMs: number = CACHE_SCORE_HALF_LIFE_MS,
): number {
	return entry.playEvents.reduce((total, playedAt) => {
		const age = Math.max(0, now - playedAt)
		return total + Math.pow(0.5, age / halfLifeMs)
	}, 0)
}

/**
 * Stable ordering for eviction: coldest first.
 *
 * Ties break on least-recently-played, then oldest entry, then track id so
 * the ordering — and therefore every eviction plan — is fully deterministic
 * for a fixed `(entries, now)`.
 */
export function compareByColdness(a: CacheEntry, b: CacheEntry, now: number): number {
	const scoreDelta = scoreEntry(a, now) - scoreEntry(b, now)
	if (scoreDelta !== 0) return scoreDelta

	const lastPlayedDelta = (a.lastPlayedAt ?? 0) - (b.lastPlayedAt ?? 0)
	if (lastPlayedDelta !== 0) return lastPlayedDelta

	const addedDelta = a.addedAt - b.addedAt
	if (addedDelta !== 0) return addedDelta

	return a.trackId < b.trackId ? -1 : a.trackId > b.trackId ? 1 : 0
}

/**
 * Records a completed play on an entry, capping stored timestamps at `cap`
 * (oldest dropped first). Returns a new entry; never mutates.
 */
export function recordPlay(entry: CacheEntry, now: number, cap: number): CacheEntry {
	const playEvents = [...entry.playEvents, now].slice(-cap)

	return {
		...entry,
		playEvents,
		lastPlayedAt: now,
	}
}
