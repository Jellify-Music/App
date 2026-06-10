import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { createVersionedMmkvStorage } from '../../constants/versioned-storage'
import { CacheLedger, EMPTY_LEDGER, EvictionPlan } from '../core/types'

type CacheStore = {
	/** The smart cache ledger — the engine's entire persisted state */
	ledger: CacheLedger
	setLedger: (ledger: CacheLedger) => void

	/**
	 * An eviction plan awaiting user confirmation (budget shrink or
	 * reconcile-discovered overage). Not persisted — a stale prompt after an
	 * app restart would describe a ledger that no longer exists.
	 */
	pendingEvictionPlan: EvictionPlan | null
	setPendingEvictionPlan: (pendingEvictionPlan: EvictionPlan | null) => void

	/** One-shot migration marker for the legacy auto-download setting */
	legacyAutoDownloadMigrated: boolean
	setLegacyAutoDownloadMigrated: (legacyAutoDownloadMigrated: boolean) => void
}

export const useCacheStore = create<CacheStore>()(
	devtools(
		persist(
			(set) => ({
				ledger: EMPTY_LEDGER,
				setLedger: (ledger) => set({ ledger }),

				pendingEvictionPlan: null,
				setPendingEvictionPlan: (pendingEvictionPlan) => set({ pendingEvictionPlan }),

				legacyAutoDownloadMigrated: false,
				setLegacyAutoDownloadMigrated: (legacyAutoDownloadMigrated) =>
					set({ legacyAutoDownloadMigrated }),
			}),
			{
				name: 'cache-ledger-storage',
				storage: createJSONStorage(() =>
					createVersionedMmkvStorage('cache-ledger-storage'),
				),
				partialize: (state) => ({
					ledger: state.ledger,
					legacyAutoDownloadMigrated: state.legacyAutoDownloadMigrated,
				}),
			},
		),
	),
)
