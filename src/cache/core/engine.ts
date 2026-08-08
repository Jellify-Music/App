import { admit } from './admission'
import { applyEviction, planEviction } from './eviction'
import { reconcile } from './reconcile'
import { recordPlay } from './scoring'
import {
	CacheEntry,
	CacheEvent,
	CacheLedger,
	DecideContext,
	Decision,
	Effect,
	EvictionPlan,
	MAX_PLAY_EVENTS_PER_ENTRY,
} from './types'

/**
 * The smart cache policy engine: a pure reducer over the ledger.
 *
 * `decide` never performs side effects — it returns the next ledger plus a
 * list of {@link Effect} commands (fetch this, evict that, ask the user to
 * confirm this plan) for the service layer to interpret against the storage
 * adapter. All policy decisions therefore live in deterministic, exhaustively
 * testable code; anything the engine gets wrong self-heals on the next
 * `disk-truth` reconciliation.
 */
export function decide(
	ledger: CacheLedger,
	event: CacheEvent,
	now: number,
	context: DecideContext,
): Decision {
	switch (event.type) {
		case 'play-completed':
			return onPlayCompleted(ledger, event.trackId, now)
		case 'play-started':
			return onPlayStarted(ledger, event.trackId)
		case 'pin':
			return onPin(ledger, event.trackId, now)
		case 'unpin':
			return onUnpin(ledger, event.trackId, now, context)
		case 'remove':
			return onRemove(ledger, event.trackId)
		case 'fetch-succeeded':
			return onFetchSucceeded(ledger, event.trackId, event.sizeBytes, now, context)
		case 'fetch-failed':
			return onFetchFailed(
				ledger,
				event.trackId,
				event.retryable,
				event.storageFull,
				now,
				context,
			)
		case 'budget-changed':
			return onBudgetChanged(ledger, event.budgetBytes, now, context)
		case 'eviction-confirmed':
			return onEvictionConfirmed(ledger, event.plan, now, context)
		case 'disk-truth':
			return onDiskTruth(ledger, event, now, context)
	}
}

function withEntry(ledger: CacheLedger, entry: CacheEntry): CacheLedger {
	return { ...ledger, entries: { ...ledger.entries, [entry.trackId]: entry } }
}

/**
 * A completed play (>80% listened — the same signal used for scrobbling)
 * records history on the entry and admits unknown tracks when the cache is
 * enabled. Newly admitted or previously evicted (`wanted`) tracks are fetched.
 */
function onPlayCompleted(ledger: CacheLedger, trackId: string, now: number): Decision {
	const existing = ledger.entries[trackId]

	if (existing) {
		let entry = recordPlay(existing, now, MAX_PLAY_EVENTS_PER_ENTRY)
		const effects: Effect[] = []

		if (entry.state === 'wanted') {
			entry = { ...entry, state: 'fetching' }
			effects.push({ type: 'fetch', trackId })
		}

		return { ledger: withEntry(ledger, entry), effects }
	}

	const admitted = admit(ledger, trackId, now)
	if (!admitted) return { ledger, effects: [] }

	const entry: CacheEntry = {
		...recordPlay(admitted, now, MAX_PLAY_EVENTS_PER_ENTRY),
		state: 'fetching',
	}

	return { ledger: withEntry(ledger, entry), effects: [{ type: 'fetch', trackId }] }
}

/**
 * Fired when a track passes the in-progress threshold (~30%). Not a completed
 * play — no history is recorded — but a track the ledger already wants (hot
 * but evicted, or recovered from a stuck download) is fetched eagerly while
 * the user is clearly listening to it.
 */
function onPlayStarted(ledger: CacheLedger, trackId: string): Decision {
	const entry = ledger.entries[trackId]
	if (!entry || entry.state !== 'wanted') return { ledger, effects: [] }

	return {
		ledger: withEntry(ledger, { ...entry, state: 'fetching' }),
		effects: [{ type: 'fetch', trackId }],
	}
}

/**
 * An explicit user download. Pins are sacred: they are never evicted and
 * never pruned. Pinning an evicted/failed entry retries the fetch; any budget
 * overage a pin causes is resolved by evicting cached entries when the fetch
 * completes (never other pins).
 */
function onPin(ledger: CacheLedger, trackId: string, now: number): Decision {
	const existing = ledger.entries[trackId]

	if (!existing) {
		const entry: CacheEntry = {
			trackId,
			origin: 'pinned',
			state: 'fetching',
			sizeBytes: 0,
			addedAt: now,
			lastPlayedAt: null,
			playEvents: [],
		}
		return { ledger: withEntry(ledger, entry), effects: [{ type: 'fetch', trackId }] }
	}

	if (existing.state === 'wanted' || existing.state === 'failed') {
		return {
			ledger: withEntry(ledger, { ...existing, origin: 'pinned', state: 'fetching' }),
			effects: [{ type: 'fetch', trackId }],
		}
	}

	return { ledger: withEntry(ledger, { ...existing, origin: 'pinned' }), effects: [] }
}

/**
 * Demotes a pin to a cached entry. The file stays, but it now competes for
 * budget like everything else — so an over-budget ledger evicts immediately
 * (silently: unpinning is an explicit statement the track is no longer
 * protected).
 */
function onUnpin(
	ledger: CacheLedger,
	trackId: string,
	now: number,
	context: DecideContext,
): Decision {
	const entry = ledger.entries[trackId]
	if (!entry || entry.origin !== 'pinned') return { ledger, effects: [] }

	const next = withEntry(ledger, { ...entry, origin: 'cached' })

	return evictSilently(next, now, context, 'over-budget')
}

/**
 * Removes a track from the cache entirely — ledger entry and file. The next
 * completed play may re-admit it; deletion is "not right now," not "never."
 */
function onRemove(ledger: CacheLedger, trackId: string): Decision {
	const entries = { ...ledger.entries }
	delete entries[trackId]

	// The evict effect is emitted even for unknown tracks: deletion requests
	// can target downloads that predate the ledger, and the delete is idempotent.
	return { ledger: { ...ledger, entries }, effects: [{ type: 'evict', trackId }] }
}

/**
 * A download finished. Unknown completions (from flows that predate the
 * ledger) are adopted as pins, mirroring reconciliation. New bytes on disk
 * may tip the budget — resolved silently; this is the cache doing its job.
 */
function onFetchSucceeded(
	ledger: CacheLedger,
	trackId: string,
	sizeBytes: number,
	now: number,
	context: DecideContext,
): Decision {
	const existing = ledger.entries[trackId]

	const entry: CacheEntry = existing
		? { ...existing, state: 'present', sizeBytes }
		: {
				trackId,
				origin: 'pinned',
				state: 'present',
				sizeBytes,
				addedAt: now,
				lastPlayedAt: null,
				playEvents: [],
			}

	return evictSilently(withEntry(ledger, entry), now, context, 'over-budget')
}

/**
 * A download failed. Retryable failures demote to `wanted` so the next play
 * retries; non-retryable failures park at `failed` (a pin retries them).
 * A full disk additionally triggers an emergency eviction pass when the
 * ledger itself is over budget.
 */
function onFetchFailed(
	ledger: CacheLedger,
	trackId: string,
	retryable: boolean,
	storageFull: boolean | undefined,
	now: number,
	context: DecideContext,
): Decision {
	const existing = ledger.entries[trackId]
	if (!existing) return { ledger, effects: [] }

	const entry: CacheEntry = {
		...existing,
		state: retryable || storageFull ? 'wanted' : 'failed',
		sizeBytes: 0,
	}

	const next = withEntry(ledger, entry)

	// If the disk is full because of other apps (we're under budget) there is
	// nothing safe to free on their behalf; only act on our own overage.
	if (storageFull) return evictSilently(next, now, context, 'storage-full')

	return { ledger: next, effects: [] }
}

/**
 * The user changed (or disabled) the budget. Shrinking below current usage is
 * destructive, so the resulting plan is surfaced via `confirm-eviction` and
 * only applied when an `eviction-confirmed` event comes back.
 */
function onBudgetChanged(
	ledger: CacheLedger,
	budgetBytes: number | null,
	now: number,
	context: DecideContext,
): Decision {
	const next = { ...ledger, budgetBytes }
	if (budgetBytes === null) return { ledger: next, effects: [] }

	const plan = planEviction(next, now, context, 'budget-shrink')
	if (!plan) return { ledger: next, effects: [] }

	return { ledger: next, effects: [{ type: 'confirm-eviction', plan }] }
}

/**
 * The user approved a surfaced plan. The plan is re-validated against the
 * current ledger (entries may have been played, pinned, or removed while the
 * prompt was up) rather than trusted verbatim.
 */
function onEvictionConfirmed(
	ledger: CacheLedger,
	plan: EvictionPlan,
	now: number,
	context: DecideContext,
): Decision {
	const validIds = plan.trackIds.filter((trackId) => {
		const entry = ledger.entries[trackId]
		return (
			entry !== undefined &&
			entry.origin === 'cached' &&
			entry.state === 'present' &&
			!context.protectedTrackIds.has(trackId)
		)
	})

	if (validIds.length === 0) return { ledger, effects: [] }

	const freedBytes = validIds.reduce(
		(total, trackId) => total + ledger.entries[trackId].sizeBytes,
		0,
	)
	const validated: EvictionPlan = { ...plan, trackIds: validIds, freedBytes }

	return {
		ledger: applyEviction(ledger, validated, now),
		effects: validIds.map((trackId) => ({ type: 'evict', trackId })),
	}
}

/**
 * Reconciliation against disk truth (startup, post-bulk operations). Overage
 * discovered here — adopted files, a budget shrunk on another device's
 * schedule — is surfaced for confirmation rather than silently evicted.
 */
function onDiskTruth(
	ledger: CacheLedger,
	event: Extract<CacheEvent, { type: 'disk-truth' }>,
	now: number,
	context: DecideContext,
): Decision {
	const next = reconcile(ledger, event.snapshot, now)

	const plan = planEviction(next, now, context, 'reconcile')
	if (!plan) return { ledger: next, effects: [] }

	return { ledger: next, effects: [{ type: 'confirm-eviction', plan }] }
}

/** Plans and immediately applies an eviction (steady-state, no prompt). */
function evictSilently(
	ledger: CacheLedger,
	now: number,
	context: DecideContext,
	reason: EvictionPlan['reason'],
): Decision {
	const plan = planEviction(ledger, now, context, reason)
	if (!plan) return { ledger, effects: [] }

	return {
		ledger: applyEviction(ledger, plan, now),
		effects: plan.trackIds.map((trackId) => ({ type: 'evict', trackId })),
	}
}
