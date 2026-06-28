import { compareByColdness, scoreEntry } from './scoring'
import {
	CACHE_LOW_WATERMARK_RATIO,
	CacheLedger,
	DecideContext,
	EvictionPlan,
	EvictionReason,
	PRUNE_SCORE_THRESHOLD,
} from './types'

/** Bytes currently occupied on disk according to the ledger */
export function usedBytes(ledger: CacheLedger): number {
	return Object.values(ledger.entries).reduce(
		(total, entry) => (entry.state === 'present' ? total + entry.sizeBytes : total),
		0,
	)
}

/**
 * Builds a plan to bring disk usage back under budget, or `null` when no
 * eviction is needed or possible.
 *
 * Invariants (covered by tests):
 * - pinned entries are never candidates
 * - protected tracks (current queue) are never candidates
 * - candidates are taken coldest-first, deterministically
 * - the plan stops once usage would drop to the low watermark
 *   ({@link CACHE_LOW_WATERMARK_RATIO} × budget) — hysteresis against
 *   one-in-one-out thrash at the boundary
 */
export function planEviction(
	ledger: CacheLedger,
	now: number,
	context: DecideContext,
	reason: EvictionReason,
): EvictionPlan | null {
	if (ledger.budgetBytes === null) return null

	const used = usedBytes(ledger)
	if (used <= ledger.budgetBytes) return null

	const target = ledger.budgetBytes * CACHE_LOW_WATERMARK_RATIO

	const candidates = Object.values(ledger.entries)
		.filter(
			(entry) =>
				entry.origin === 'cached' &&
				entry.state === 'present' &&
				!context.protectedTrackIds.has(entry.trackId),
		)
		.sort((a, b) => compareByColdness(a, b, now))

	const trackIds: string[] = []
	let freedBytes = 0

	for (const entry of candidates) {
		if (used - freedBytes <= target) break
		trackIds.push(entry.trackId)
		freedBytes += entry.sizeBytes
	}

	if (trackIds.length === 0) return null

	return { trackIds, freedBytes, reason }
}

/**
 * Applies an eviction plan to the ledger: evicted entries are demoted to
 * `wanted` (keeping their play history so a hot-but-evicted track re-admits
 * with its score intact), then stale history is pruned.
 */
export function applyEviction(ledger: CacheLedger, plan: EvictionPlan, now: number): CacheLedger {
	const entries = { ...ledger.entries }

	for (const trackId of plan.trackIds) {
		const entry = entries[trackId]
		if (!entry || entry.origin !== 'cached' || entry.state !== 'present') continue

		entries[trackId] = { ...entry, state: 'wanted', sizeBytes: 0 }
	}

	return pruneStale({ ...ledger, entries }, now)
}

/**
 * Drops `cached` entries that aren't on disk (or in flight) and whose score
 * has decayed below {@link PRUNE_SCORE_THRESHOLD}. This bounds ledger growth
 * to recently-relevant tracks; pinned entries are never pruned.
 */
export function pruneStale(ledger: CacheLedger, now: number): CacheLedger {
	const entries: CacheLedger['entries'] = {}

	for (const entry of Object.values(ledger.entries)) {
		const prunable =
			entry.origin === 'cached' &&
			entry.state !== 'present' &&
			entry.state !== 'fetching' &&
			scoreEntry(entry, now) < PRUNE_SCORE_THRESHOLD

		if (!prunable) entries[entry.trackId] = entry
	}

	return { ...ledger, entries }
}
