import { CacheEntry, CacheLedger } from './types'

/**
 * Decides whether a completed play admits a track into the cache.
 *
 * Admission is deliberately generous — one completed play qualifies — because
 * the budget and eviction policy are what keep the cache honest. A second
 * knob ("play N times before caching") would add tuning burden without
 * changing steady-state behavior.
 *
 * Returns a fresh `cached`/`wanted` entry, or `null` when the cache is
 * disabled or the track is already tracked.
 */
export function admit(ledger: CacheLedger, trackId: string, now: number): CacheEntry | null {
	if (ledger.budgetBytes === null) return null
	if (ledger.entries[trackId]) return null

	return {
		trackId,
		origin: 'cached',
		state: 'wanted',
		sizeBytes: 0,
		addedAt: now,
		lastPlayedAt: null,
		playEvents: [],
	}
}
