import { pruneStale } from './eviction'
import { CacheEntry, CacheLedger, DiskSnapshot } from './types'

/**
 * Repairs the ledger against disk truth. The ledger is metadata only — the
 * storage layer owns the bytes — so on every startup (and after bulk
 * operations) drift is resolved in both directions:
 *
 * - On disk but unknown to the ledger → adopted as `pinned`/`present`.
 *   Conservative: a file we can't explain is treated as user intent, never
 *   eviction fodder. This is also how pre-existing downloads migrate into
 *   the ledger on first run.
 * - In the ledger as `present` but missing on disk → demoted to `wanted`
 *   (cached) or `failed` (pinned, so the UI can offer a re-download).
 * - In the ledger as `fetching` with no active download task → the stuck
 *   download case: demoted to `wanted` so the next play (or pin) retries.
 * - Sizes refreshed from disk for everything present.
 *
 * Stale non-resident entries are pruned at the end. Pure function; never
 * mutates its inputs.
 */
export function reconcile(ledger: CacheLedger, snapshot: DiskSnapshot, now: number): CacheLedger {
	const entries: CacheLedger['entries'] = {}
	const onDisk = new Map(snapshot.present.map((track) => [track.trackId, track]))
	const inFlight = new Set(snapshot.fetching)

	for (const entry of Object.values(ledger.entries)) {
		entries[entry.trackId] = reconcileEntry(entry, onDisk.get(entry.trackId), inFlight)
	}

	for (const track of snapshot.present) {
		if (entries[track.trackId]) continue

		entries[track.trackId] = {
			trackId: track.trackId,
			origin: 'pinned',
			state: 'present',
			sizeBytes: track.sizeBytes,
			addedAt: now,
			lastPlayedAt: null,
			playEvents: [],
		}
	}

	return pruneStale({ ...ledger, entries }, now)
}

function reconcileEntry(
	entry: CacheEntry,
	diskTrack: { trackId: string; sizeBytes: number } | undefined,
	inFlight: ReadonlySet<string>,
): CacheEntry {
	if (diskTrack) {
		if (entry.state === 'present' && entry.sizeBytes === diskTrack.sizeBytes) return entry
		return { ...entry, state: 'present', sizeBytes: diskTrack.sizeBytes }
	}

	switch (entry.state) {
		case 'present':
			return entry.origin === 'pinned'
				? { ...entry, state: 'failed', sizeBytes: 0 }
				: { ...entry, state: 'wanted', sizeBytes: 0 }
		case 'fetching':
			return inFlight.has(entry.trackId) ? entry : { ...entry, state: 'wanted', sizeBytes: 0 }
		default:
			return entry
	}
}
