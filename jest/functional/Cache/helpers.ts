import { CacheEntry, CacheLedger, DecideContext } from '../../../src/cache/core/types'

export const NOW = 1_750_000_000_000
export const DAY = 24 * 60 * 60 * 1000
export const MB = 1024 * 1024

export const makeEntry = (overrides: Partial<CacheEntry> & { trackId: string }): CacheEntry => ({
	origin: 'cached',
	state: 'present',
	sizeBytes: 10 * MB,
	addedAt: NOW - 30 * DAY,
	lastPlayedAt: null,
	playEvents: [],
	...overrides,
})

export const makeLedger = (
	budgetBytes: number | null,
	entries: CacheEntry[] = [],
): CacheLedger => ({
	budgetBytes,
	entries: Object.fromEntries(entries.map((entry) => [entry.trackId, entry])),
})

export const contextWith = (...protectedTrackIds: string[]): DecideContext => ({
	protectedTrackIds: new Set(protectedTrackIds),
})
