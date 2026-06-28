import { TrackItem } from 'react-native-nitro-player'
import { useCacheStore } from '../../../src/cache/adapters/ledger-store'
import { CacheStorageAdapter } from '../../../src/cache/adapters/storage-adapter'
import { DiskSnapshot, EMPTY_LEDGER } from '../../../src/cache/core/types'
import { DEFAULT_CACHE_BUDGET_BYTES, createCacheService } from '../../../src/cache/service'
import { queryClient } from '../../../src/constants/query-client'
import { useUsageSettingsStore } from '../../../src/stores/settings/usage'
import { MB } from './helpers'

const makeTrack = (id: string): TrackItem => ({
	id,
	title: `Track ${id}`,
	artist: 'Artist',
	album: 'Album',
	duration: 180,
	url: '',
})

type FakeAdapter = CacheStorageAdapter & {
	fetched: string[]
	evicted: string[]
	failNextFetch: boolean
}

const makeFakeAdapter = (snapshot: DiskSnapshot = { present: [], fetching: [] }): FakeAdapter => {
	const adapter: FakeAdapter = {
		fetched: [],
		evicted: [],
		failNextFetch: false,

		async fetch(track: TrackItem) {
			if (adapter.failNextFetch) {
				adapter.failNextFetch = false
				throw new Error('network down')
			}
			adapter.fetched.push(track.id)
		},
		async evict(trackId: string) {
			adapter.evicted.push(trackId)
		},
		async snapshot() {
			return snapshot
		},
	}

	return adapter
}

// resolveTrackUrls (used only by the real nitro adapter) pulls in the API
// layer; the fake adapter keeps these tests entirely in-memory.
jest.mock('../../../src/utils/fetching/track-media-info', () => ({
	__esModule: true,
	default: jest.fn(async (tracks: TrackItem[]) => tracks),
}))

describe('cacheService', () => {
	beforeEach(() => {
		useCacheStore.setState({
			ledger: EMPTY_LEDGER,
			pendingEvictionPlan: null,
			legacyAutoDownloadMigrated: false,
		})
		useUsageSettingsStore.setState({ autoDownload: false })
	})

	afterAll(() => {
		// pinTracks seeds the shared query client; drop the cached query so its
		// gc timer doesn't hold the test process open
		queryClient.clear()
	})

	it('admits a completed play, fetches it, and marks it present on completion', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(1024 * MB)

		service.notifyPlayCompleted(makeTrack('song'))
		await service.flush()

		expect(adapter.fetched).toEqual(['song'])
		expect(useCacheStore.getState().ledger.entries['song']).toMatchObject({
			origin: 'cached',
			state: 'fetching',
		})

		service.notifyDownloadCompleted({
			trackId: 'song',
			originalTrack: makeTrack('song'),
			localPath: '/tmp/song.flac',
			downloadedAt: Date.now(),
			fileSize: 8 * MB,
			storageLocation: 'private',
		})
		await service.flush()

		expect(useCacheStore.getState().ledger.entries['song']).toMatchObject({
			state: 'present',
			sizeBytes: 8 * MB,
		})
	})

	it('ignores plays entirely while the cache is disabled', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		service.notifyPlayCompleted(makeTrack('song'))
		await service.flush()

		expect(adapter.fetched).toEqual([])
		expect(useCacheStore.getState().ledger.entries['song']).toBeUndefined()
	})

	it('returns a track to wanted when its fetch cannot be started', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(1024 * MB)
		adapter.failNextFetch = true

		service.notifyPlayCompleted(makeTrack('song'))
		await service.flush()
		// The failure dispatches a follow-up event onto the pump
		await service.flush()

		expect(useCacheStore.getState().ledger.entries['song'].state).toBe('wanted')
	})

	it('evicts the coldest cached track when a completed fetch tips the budget', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(10 * MB)

		// A cold cached resident occupying most of the budget
		useCacheStore.setState((state) => ({
			ledger: {
				...state.ledger,
				entries: {
					cold: {
						trackId: 'cold',
						origin: 'cached',
						state: 'present',
						sizeBytes: 8 * MB,
						addedAt: Date.now() - 1000,
						lastPlayedAt: Date.now() - 1000,
						playEvents: [],
					},
				},
			},
		}))

		service.notifyPlayCompleted(makeTrack('hot'))
		await service.flush()
		service.notifyDownloadCompleted({
			trackId: 'hot',
			originalTrack: makeTrack('hot'),
			localPath: '/tmp/hot.flac',
			downloadedAt: Date.now(),
			fileSize: 8 * MB,
			storageLocation: 'private',
		})
		await service.flush()

		expect(adapter.evicted).toEqual(['cold'])
		expect(useCacheStore.getState().ledger.entries['hot'].state).toBe('present')
	})

	it('pins tracks explicitly and never evicts them to make room', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.pinTracks([{ Id: 'pinned-song', Name: 'Pinned' }])

		expect(adapter.fetched).toEqual(['pinned-song'])
		expect(useCacheStore.getState().ledger.entries['pinned-song']).toMatchObject({
			origin: 'pinned',
			state: 'fetching',
		})
	})

	it('removes tracks from ledger and disk', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.pinTracks([{ Id: 'song', Name: 'Song' }])
		await service.removeTracks(['song'])

		expect(adapter.evicted).toEqual(['song'])
		expect(useCacheStore.getState().ledger.entries['song']).toBeUndefined()
	})

	it('surfaces a budget-shrink plan and only evicts after confirmation', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(100 * MB)
		useCacheStore.setState((state) => ({
			ledger: {
				...state.ledger,
				entries: {
					resident: {
						trackId: 'resident',
						origin: 'cached',
						state: 'present',
						sizeBytes: 50 * MB,
						addedAt: Date.now(),
						lastPlayedAt: Date.now(),
						playEvents: [Date.now()],
					},
				},
			},
		}))

		await service.setBudget(10 * MB)

		const plan = useCacheStore.getState().pendingEvictionPlan
		expect(plan).toMatchObject({ reason: 'budget-shrink', trackIds: ['resident'] })
		expect(adapter.evicted).toEqual([])

		await service.confirmPendingEviction()

		expect(adapter.evicted).toEqual(['resident'])
		expect(useCacheStore.getState().pendingEvictionPlan).toBeNull()
	})

	it('dismissing a surfaced plan keeps everything on disk', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(100 * MB)
		useCacheStore.setState((state) => ({
			ledger: {
				...state.ledger,
				entries: {
					resident: {
						trackId: 'resident',
						origin: 'cached',
						state: 'present',
						sizeBytes: 50 * MB,
						addedAt: Date.now(),
						lastPlayedAt: Date.now(),
						playEvents: [Date.now()],
					},
				},
			},
		}))
		await service.setBudget(10 * MB)

		service.dismissPendingEviction()
		await service.flush()

		expect(adapter.evicted).toEqual([])
		expect(useCacheStore.getState().pendingEvictionPlan).toBeNull()
		expect(useCacheStore.getState().ledger.entries['resident'].state).toBe('present')
	})

	it('initialize adopts pre-ledger downloads from disk as pins', async () => {
		const adapter = makeFakeAdapter({
			present: [{ trackId: 'legacy-download', sizeBytes: 12 * MB }],
			fetching: [],
		})
		const service = createCacheService(adapter)

		await service.initialize()
		await service.flush()

		expect(useCacheStore.getState().ledger.entries['legacy-download']).toMatchObject({
			origin: 'pinned',
			state: 'present',
			sizeBytes: 12 * MB,
		})
	})

	it('initialize migrates a legacy auto-download user to a default budget, once', async () => {
		useUsageSettingsStore.setState({ autoDownload: true })

		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.initialize()
		await service.flush()

		expect(useCacheStore.getState().ledger.budgetBytes).toBe(DEFAULT_CACHE_BUDGET_BYTES)
		expect(useCacheStore.getState().legacyAutoDownloadMigrated).toBe(true)

		// Disabling afterwards must stick across restarts
		await service.setBudget(null)
		await service.initialize()
		await service.flush()

		expect(useCacheStore.getState().ledger.budgetBytes).toBeNull()
	})

	it('eagerly re-fetches a wanted track once playback passes the started threshold', async () => {
		const adapter = makeFakeAdapter()
		const service = createCacheService(adapter)

		await service.setBudget(1024 * MB)
		useCacheStore.setState((state) => ({
			ledger: {
				...state.ledger,
				entries: {
					evicted: {
						trackId: 'evicted',
						origin: 'cached',
						state: 'wanted',
						sizeBytes: 0,
						addedAt: Date.now(),
						lastPlayedAt: Date.now(),
						playEvents: [Date.now()],
					},
				},
			},
		}))

		const track = makeTrack('evicted')
		// Below the threshold: nothing happens
		service.notifyPlaybackProgress(10, 180, track)
		await service.flush()
		expect(adapter.fetched).toEqual([])

		// Past the threshold: fetched exactly once, even across repeated ticks
		service.notifyPlaybackProgress(120, 180, track)
		service.notifyPlaybackProgress(121, 180, track)
		await service.flush()

		expect(adapter.fetched).toEqual(['evicted'])
	})
})
