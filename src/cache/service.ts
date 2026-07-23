import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { DownloadedTrack, TrackItem } from 'react-native-nitro-player'
import { ensureDownloadedTracks } from '../hooks/downloads/utils'
import { usePlayerQueueStore } from '../stores/player/queue'
import { useUsageSettingsStore } from '../stores/settings/usage'
import { captureError } from '../utils/logging'
import LoggingContext from '../utils/logging/enums'
import { mapDtosToTracks } from '../utils/mapping/item-to-track'
import { CacheStorageAdapter, nitroStorageAdapter } from './adapters/storage-adapter'
import { useCacheStore } from './adapters/ledger-store'
import { decide } from './core/engine'
import { CacheEvent, DecideContext, Effect } from './core/types'

/** Budget applied when migrating a legacy auto-download user to the smart cache */
export const DEFAULT_CACHE_BUDGET_BYTES = 4 * 1024 * 1024 * 1024

/** Playback fraction after which a listen counts as "started" (eager fetch) */
const PLAY_STARTED_THRESHOLD = 0.3

/**
 * The smart cache service: feeds {@link CacheEvent}s through the pure engine
 * and interprets the resulting effects against a storage adapter.
 *
 * Events are processed strictly one at a time (a promise-chain pump), so the
 * engine always decides against the ledger produced by the previous event —
 * no interleaving between a decision and the effect dispatch that follows it.
 *
 * Built as a factory so tests can run the full service against a fake
 * adapter; the app uses the {@link cacheService} singleton below.
 */
export function createCacheService(adapter: CacheStorageAdapter) {
	/** Track payloads needed to execute fetch effects, keyed by track id */
	const knownTracks = new Map<string, TrackItem>()

	/** Tracks that already emitted play-started this session */
	const playStartedNotified = new Set<string>()

	let pump: Promise<void> = Promise.resolve()

	/** Queue an event; resolves when the event and its effects have been handled */
	function dispatch(event: CacheEvent): Promise<void> {
		pump = pump.then(() => process(event))
		return pump
	}

	async function process(event: CacheEvent): Promise<void> {
		try {
			const store = useCacheStore.getState()
			const { ledger, effects } = decide(store.ledger, event, Date.now(), currentContext())

			if (ledger !== store.ledger) store.setLedger(ledger)

			await executeEffects(effects)
		} catch (error) {
			captureError(error, LoggingContext.SmartCache, `Failed to process ${event.type} event`)
		}
	}

	function currentContext(): DecideContext {
		const { queue } = usePlayerQueueStore.getState()

		return { protectedTrackIds: new Set(queue.map((track) => track.id)) }
	}

	async function executeEffects(effects: Effect[]): Promise<void> {
		for (const effect of effects) {
			switch (effect.type) {
				case 'fetch':
					await executeFetch(effect.trackId)
					break
				case 'evict':
					await executeEvict(effect.trackId)
					break
				case 'confirm-eviction':
					useCacheStore.getState().setPendingEvictionPlan(effect.plan)
					break
			}
		}
	}

	async function executeFetch(trackId: string): Promise<void> {
		const track = knownTracks.get(trackId)

		// Without a track payload there is nothing to download with; return the
		// entry to `wanted` so the next play retries. Queued, not awaited — the
		// pump is currently processing the event that produced this effect.
		if (!track) {
			void dispatch({ type: 'fetch-failed', trackId, retryable: true })
			return
		}

		try {
			await adapter.fetch(track)
		} catch (error) {
			captureError(error, LoggingContext.SmartCache, `Failed to start fetch for ${trackId}`)
			void dispatch({ type: 'fetch-failed', trackId, retryable: true })
		}
	}

	async function executeEvict(trackId: string): Promise<void> {
		try {
			await adapter.evict(trackId)
		} catch (error) {
			// The ledger already dropped the entry; reconciliation re-adopts the
			// file if the delete genuinely failed.
			captureError(error, LoggingContext.SmartCache, `Failed to evict ${trackId}`)
		}
	}

	return {
		/**
		 * Startup: migrate the legacy auto-download setting once, then reconcile
		 * the ledger against disk truth (which also adopts any downloads that
		 * predate the ledger, and recovers stuck `fetching` entries).
		 */
		async initialize(): Promise<void> {
			const store = useCacheStore.getState()

			if (!store.legacyAutoDownloadMigrated) {
				store.setLegacyAutoDownloadMigrated(true)

				const { autoDownload } = useUsageSettingsStore.getState()
				if (autoDownload && store.ledger.budgetBytes === null) {
					void dispatch({
						type: 'budget-changed',
						budgetBytes: DEFAULT_CACHE_BUDGET_BYTES,
					})
				}
			}

			try {
				const snapshot = await adapter.snapshot()
				await dispatch({ type: 'disk-truth', snapshot })
			} catch (error) {
				captureError(error, LoggingContext.SmartCache, 'Startup reconciliation failed')
			}
		},

		/**
		 * Playback progress hook (called per second tick). Past the started
		 * threshold, gives the engine a chance to eagerly re-fetch a track it
		 * already wants while the user is clearly listening to it.
		 */
		notifyPlaybackProgress(position: number, totalDuration: number, track: TrackItem): void {
			if (!track?.id || totalDuration <= 0) return
			if (position / totalDuration <= PLAY_STARTED_THRESHOLD) return
			if (playStartedNotified.has(track.id)) return

			playStartedNotified.add(track.id)
			knownTracks.set(track.id, track)

			void dispatch({ type: 'play-started', trackId: track.id })
		},

		/**
		 * A completed play (>80% listened — the same threshold as scrobbling).
		 * Records history and admits the track when the cache is enabled.
		 */
		notifyPlayCompleted(track: TrackItem): void {
			if (!track?.id) return

			playStartedNotified.delete(track.id)
			knownTracks.set(track.id, track)

			void dispatch({ type: 'play-completed', trackId: track.id })
		},

		/** Explicit user download: pin every track so it is never auto-evicted */
		async pinTracks(items: BaseItemDto[]): Promise<void> {
			const downloadedTracks = await ensureDownloadedTracks()
			const tracks = mapDtosToTracks(items, downloadedTracks)

			for (const track of tracks) knownTracks.set(track.id, track)

			await Promise.all(tracks.map((track) => dispatch({ type: 'pin', trackId: track.id })))
		},

		/** Delete tracks from the cache — ledger entries and files */
		async removeTracks(trackIds: string[]): Promise<void> {
			await Promise.all(trackIds.map((trackId) => dispatch({ type: 'remove', trackId })))
		},

		/** Enable, resize, or disable (`null`) the cache budget */
		setBudget(budgetBytes: number | null): Promise<void> {
			return dispatch({ type: 'budget-changed', budgetBytes })
		},

		/** Apply the surfaced eviction plan the user just approved */
		confirmPendingEviction(): Promise<void> {
			const store = useCacheStore.getState()
			const plan = store.pendingEvictionPlan

			store.setPendingEvictionPlan(null)
			if (!plan) return Promise.resolve()

			return dispatch({ type: 'eviction-confirmed', plan })
		},

		/** Dismiss the surfaced eviction plan without evicting */
		dismissPendingEviction(): void {
			useCacheStore.getState().setPendingEvictionPlan(null)
		},

		/** Feed of native download completions (wired in services/downloads.ts) */
		notifyDownloadCompleted(download: DownloadedTrack): void {
			void dispatch({
				type: 'fetch-succeeded',
				trackId: download.trackId,
				sizeBytes: download.fileSize ?? 0,
			})
		},

		/** Feed of native download failures (wired in services/downloads.ts) */
		notifyDownloadFailed(trackId: string, retryable: boolean, storageFull: boolean): void {
			void dispatch({ type: 'fetch-failed', trackId, retryable, storageFull })
		},

		/** Resolves once every event queued so far has been processed */
		flush(): Promise<void> {
			return pump
		},
	}
}

export type CacheService = ReturnType<typeof createCacheService>

/** App-wide smart cache service bound to the nitro download manager */
export const cacheService = createCacheService(nitroStorageAdapter)
