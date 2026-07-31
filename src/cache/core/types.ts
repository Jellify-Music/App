/**
 * Smart cache core types.
 *
 * Everything in `src/cache/core` is pure TypeScript — no React, React Native,
 * or nitro imports — so the entire policy surface is unit-testable with plain
 * objects and an explicit clock.
 */

/**
 * Why a track is on disk.
 *
 * `pinned` tracks were explicitly downloaded by the user and are never
 * auto-evicted. `cached` tracks earned their place through listening and may
 * be evicted when the budget is exceeded.
 */
export type CacheOrigin = 'pinned' | 'cached'

/**
 * Lifecycle of a cache entry.
 *
 * `wanted`   — admitted (or pinned) but not on disk; a fetch may be issued
 * `fetching` — a download has been dispatched and is in flight
 * `present`  — the file is on disk
 * `failed`   — a non-retryable fetch failure or a pinned file that vanished
 */
export type CacheEntryState = 'wanted' | 'fetching' | 'present' | 'failed'

export type CacheEntry = {
	trackId: string
	origin: CacheOrigin
	state: CacheEntryState
	/** Bytes on disk; `0` unless `state` is `present` */
	sizeBytes: number
	addedAt: number
	lastPlayedAt: number | null
	/**
	 * Timestamps of recent completed plays, newest last, capped at
	 * {@link MAX_PLAY_EVENTS_PER_ENTRY}. Kept as raw timestamps (not a counter)
	 * so the recency-decayed score is a pure function of the entry and a clock.
	 */
	playEvents: number[]
}

export type CacheLedger = {
	/** `null` means the smart cache is disabled */
	budgetBytes: number | null
	entries: Record<string, CacheEntry>
}

export type EvictionReason = 'over-budget' | 'budget-shrink' | 'storage-full' | 'reconcile'

export type EvictionPlan = {
	trackIds: string[]
	freedBytes: number
	reason: EvictionReason
}

/** A track that exists on disk according to the storage layer */
export type DiskTrack = {
	trackId: string
	sizeBytes: number
}

/** Disk truth used to reconcile the ledger with the storage layer */
export type DiskSnapshot = {
	present: DiskTrack[]
	/** Track ids with an active (in-flight) download task */
	fetching: string[]
}

export type CacheEvent =
	| { type: 'play-started'; trackId: string }
	| { type: 'play-completed'; trackId: string }
	| { type: 'pin'; trackId: string }
	| { type: 'unpin'; trackId: string }
	| { type: 'remove'; trackId: string }
	| { type: 'fetch-succeeded'; trackId: string; sizeBytes: number }
	| { type: 'fetch-failed'; trackId: string; retryable: boolean; storageFull?: boolean }
	| { type: 'budget-changed'; budgetBytes: number | null }
	| { type: 'eviction-confirmed'; plan: EvictionPlan }
	| { type: 'disk-truth'; snapshot: DiskSnapshot }

/**
 * Commands the engine asks the service layer to perform. The engine never
 * touches storage itself — it only describes what should happen next.
 */
export type Effect =
	| { type: 'fetch'; trackId: string }
	| { type: 'evict'; trackId: string }
	| { type: 'confirm-eviction'; plan: EvictionPlan }

export type DecideContext = {
	/**
	 * Track ids that must not be evicted right now — typically the current
	 * play queue. Protected tracks are skipped by eviction planning and
	 * reconsidered on the next pass.
	 */
	protectedTrackIds: ReadonlySet<string>
}

export type Decision = {
	ledger: CacheLedger
	effects: Effect[]
}

/** Half-life of a completed play's contribution to the hotness score */
export const CACHE_SCORE_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Eviction target as a fraction of the budget. Evicting down to 90% (rather
 * than exactly 100%) prevents one-in-one-out thrash at the boundary.
 */
export const CACHE_LOW_WATERMARK_RATIO = 0.9

/** Cap on stored play timestamps per entry */
export const MAX_PLAY_EVENTS_PER_ENTRY = 20

/**
 * Entries that aren't on disk and whose score decays below this threshold are
 * pruned from the ledger. A single play reaches 0.05 after ~60 days at the
 * default half-life, which bounds ledger growth to recently-relevant tracks.
 */
export const PRUNE_SCORE_THRESHOLD = 0.05

export const EMPTY_LEDGER: CacheLedger = Object.freeze({
	budgetBytes: null,
	entries: {},
})

export const EMPTY_CONTEXT: DecideContext = Object.freeze({
	protectedTrackIds: new Set<string>(),
})
