import { useShallow } from 'zustand/react/shallow'
import { useCacheStore } from './adapters/ledger-store'
import { usedBytes } from './core/eviction'
import { CacheEntry, EvictionPlan } from './core/types'

/** Current cache budget in bytes, or `null` when the smart cache is disabled */
export const useCacheBudget = (): number | null =>
	useCacheStore((state) => state.ledger.budgetBytes)

/** Bytes currently on disk according to the ledger (pinned + cached) */
export const useCacheUsedBytes = (): number => useCacheStore((state) => usedBytes(state.ledger))

/** The eviction plan awaiting user confirmation, if any */
export const usePendingEvictionPlan = (): EvictionPlan | null =>
	useCacheStore((state) => state.pendingEvictionPlan)

/** Ledger entry for a track, if it is known to the cache */
export const useCacheEntry = (trackId: string | null | undefined): CacheEntry | undefined =>
	useCacheStore((state) => (trackId ? state.ledger.entries[trackId] : undefined))

export type CacheBreakdown = {
	pinnedCount: number
	pinnedBytes: number
	cachedCount: number
	cachedBytes: number
}

/** On-disk composition of the cache, split by origin */
export const useCacheBreakdown = (): CacheBreakdown =>
	useCacheStore(
		useShallow((state) => {
			const breakdown: CacheBreakdown = {
				pinnedCount: 0,
				pinnedBytes: 0,
				cachedCount: 0,
				cachedBytes: 0,
			}

			for (const entry of Object.values(state.ledger.entries)) {
				if (entry.state !== 'present') continue

				if (entry.origin === 'pinned') {
					breakdown.pinnedCount += 1
					breakdown.pinnedBytes += entry.sizeBytes
				} else {
					breakdown.cachedCount += 1
					breakdown.cachedBytes += entry.sizeBytes
				}
			}

			return breakdown
		}),
	)
