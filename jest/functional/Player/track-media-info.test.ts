import { TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { updateTrackMediaInfo } from '../../../src/services/utils/track-media-info'
import { onTracksNeedUpdate } from '../../../src/services/utils/event-handlers'
import resolveTrackUrls from '../../../src/utils/fetching/track-media-info'
import { updateQueueTracks, usePlayerQueueStore } from '../../../src/stores/player/queue'

jest.mock('../../../src/utils/fetching/track-media-info', () => ({
	__esModule: true,
	default: jest.fn(),
}))

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: { getState: jest.fn() },
	updateQueueTracks: jest.fn(),
}))

jest.mock('../../../src/utils/logging', () => ({
	captureInfo: jest.fn(),
	captureError: jest.fn(),
	captureWarning: jest.fn(),
	LoggingContext: {
		MediaInfo: 'MediaInfo',
		AutoDownload: 'AutoDownload',
		Player: 'Player',
	},
}))

// Stub event-handlers.ts transitive dependencies so the module loads cleanly
jest.mock('../../../src/api/mutations/playback/functions/playback-completed', () => ({
	__esModule: true,
	default: jest.fn(),
}))
jest.mock('../../../src/api/mutations/playback/functions/playback-progress', () => ({
	__esModule: true,
	default: jest.fn(),
}))
jest.mock('../../../src/api/mutations/playback/functions/playback-started', () => ({
	__esModule: true,
	default: jest.fn(),
}))
jest.mock('../../../src/api/mutations/playback/functions/playback-stopped', () => ({
	__esModule: true,
	default: jest.fn(),
}))
jest.mock('../../../src/api/mutations/playback/utils', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(false),
}))
jest.mock('../../../src/stores/player/playback', () => ({
	usePlayerPlaybackStore: {
		getState: jest.fn().mockReturnValue({ position: 0 }),
		setState: jest.fn(),
	},
}))
jest.mock('../../../src/stores/settings/player', () => ({
	usePlayerSettingsStore: {
		getState: jest.fn().mockReturnValue({ enableAudioNormalization: false }),
	},
}))
jest.mock('../../../src/utils/audio/normalization', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(undefined),
	resetPlayerVolume: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../../src/services/utils/auto-download', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(undefined),
}))

// ─── helpers ────────────────────────────────────────────────────────────────

const createTrack = (id: string, url = `https://example.com/${id}.mp3`): TrackItem =>
	({
		id,
		title: id,
		artist: 'Artist',
		album: 'Album',
		duration: 180,
		url,
		extraPayload: { sessionId: 'SESSION', mediaSourceInfo: '{}', item: '{}' },
	}) as unknown as TrackItem

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }

function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((res) => {
		resolve = res
	})
	return { promise, resolve }
}

// ─── updateTrackMediaInfo ────────────────────────────────────────────────────

describe('updateTrackMediaInfo', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(TrackPlayer.updateTracks as jest.Mock).mockResolvedValue(undefined)
	})

	it('resolves URLs, updates the player, syncs the queue store, and returns updated tracks', async () => {
		const track = createTrack('a', '')
		const updatedTrack = createTrack('a', 'https://cdn.example.com/a.mp3')
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([updatedTrack])

		const result = await updateTrackMediaInfo([track])

		expect(resolveTrackUrls).toHaveBeenCalledWith([track], 'stream', expect.any(AbortSignal))
		expect(TrackPlayer.updateTracks).toHaveBeenCalledWith([updatedTrack])
		expect(updateQueueTracks).toHaveBeenCalledWith([updatedTrack])
		expect(result).toEqual([updatedTrack])
	})

	it('aborts the in-flight update when a second call arrives before the first resolves', async () => {
		const firstTracks = [createTrack('a', '')]
		const secondTracks = [createTrack('b', '')]
		const updatedSecond = [createTrack('b', 'https://cdn.example.com/b.mp3')]

		const firstDeferred = deferred<TrackItem[]>()
		;(resolveTrackUrls as jest.Mock)
			.mockReturnValueOnce(firstDeferred.promise) // first call hangs
			.mockResolvedValueOnce(updatedSecond) // second call resolves immediately

		// Start first call without awaiting — it will hang on resolveTrackUrls
		const firstCall = updateTrackMediaInfo(firstTracks)

		// Second call starts, aborting the first call's AbortController
		await updateTrackMediaInfo(secondTracks)

		// Resolve the first promise now that its signal is already aborted
		firstDeferred.resolve(firstTracks)
		await firstCall

		// Only the second call should have updated the player and queue
		expect(TrackPlayer.updateTracks).toHaveBeenCalledTimes(1)
		expect(TrackPlayer.updateTracks).toHaveBeenCalledWith(updatedSecond)
		expect(updateQueueTracks).toHaveBeenCalledTimes(1)
		expect(updateQueueTracks).toHaveBeenCalledWith(updatedSecond)
	})

	it('returns an empty array for the aborted call without touching the player or queue', async () => {
		const firstTracks = [createTrack('a', '')]
		const secondTracks = [createTrack('b', '')]

		const firstDeferred = deferred<TrackItem[]>()
		;(resolveTrackUrls as jest.Mock)
			.mockReturnValueOnce(firstDeferred.promise)
			.mockResolvedValueOnce([createTrack('b', 'https://cdn.example.com/b.mp3')])

		const firstCall = updateTrackMediaInfo(firstTracks)

		await updateTrackMediaInfo(secondTracks)

		firstDeferred.resolve(firstTracks)
		const firstResult = await firstCall

		expect(firstResult).toEqual([])
	})

	it('passes the AbortSignal to resolveTrackUrls so it can stop in-flight network requests', async () => {
		const track = createTrack('a', '')
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])

		await updateTrackMediaInfo([track])

		const [, , signal] = (resolveTrackUrls as jest.Mock).mock.calls[0]
		expect(signal).toBeInstanceOf(AbortSignal)
		expect(signal.aborted).toBe(false)
	})
})

// ─── onTracksNeedUpdate ──────────────────────────────────────────────────────

describe('onTracksNeedUpdate', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(TrackPlayer.updateTracks as jest.Mock).mockResolvedValue(undefined)
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({ isQueuing: false })
	})

	it('returns immediately and does not fetch media info when the tracks array is empty', async () => {
		await onTracksNeedUpdate([], 5)

		expect(resolveTrackUrls).not.toHaveBeenCalled()
		expect(TrackPlayer.updateTracks).not.toHaveBeenCalled()
	})

	it('returns immediately and does not fetch media info while a queue change is in progress', async () => {
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({ isQueuing: true })

		await onTracksNeedUpdate([createTrack('a', '')], 5)

		expect(resolveTrackUrls).not.toHaveBeenCalled()
		expect(TrackPlayer.updateTracks).not.toHaveBeenCalled()
	})

	it('only resolves tracks up to the lookahead count, not the full list', async () => {
		const tracks = ['a', 'b', 'c', 'd', 'e'].map((id) => createTrack(id, ''))
		const updatedSlice = tracks.slice(0, 2).map((t) => ({ ...t, url: `https://cdn/${t.id}` }))
		;(resolveTrackUrls as jest.Mock).mockResolvedValue(updatedSlice)

		await onTracksNeedUpdate(tracks, 2)

		expect(resolveTrackUrls).toHaveBeenCalledWith(
			tracks.slice(0, 2),
			'stream',
			expect.any(AbortSignal),
		)
	})

	it('passes all tracks when the lookahead equals or exceeds the track count', async () => {
		const tracks = ['a', 'b'].map((id) => createTrack(id, ''))
		;(resolveTrackUrls as jest.Mock).mockResolvedValue(tracks)

		await onTracksNeedUpdate(tracks, 10)

		expect(resolveTrackUrls).toHaveBeenCalledWith(tracks, 'stream', expect.any(AbortSignal))
	})

	it('aborts the in-flight update from the first event when a second event arrives', async () => {
		const firstTracks = [createTrack('a', '')]
		const secondTracks = [createTrack('b', '')]
		const updatedSecond = [createTrack('b', 'https://cdn.example.com/b.mp3')]

		const firstDeferred = deferred<TrackItem[]>()
		;(resolveTrackUrls as jest.Mock)
			.mockReturnValueOnce(firstDeferred.promise)
			.mockResolvedValueOnce(updatedSecond)

		// First event — hangs on resolveTrackUrls
		const firstEvent = onTracksNeedUpdate(firstTracks, 1)

		// Second event — aborts the first and completes
		await onTracksNeedUpdate(secondTracks, 1)

		// Unblock first event after its signal is already aborted
		firstDeferred.resolve(firstTracks)
		await firstEvent

		// Player and queue should only reflect the second event's update
		expect(TrackPlayer.updateTracks).toHaveBeenCalledTimes(1)
		expect(TrackPlayer.updateTracks).toHaveBeenCalledWith(updatedSecond)
		expect(updateQueueTracks).toHaveBeenCalledTimes(1)
		expect(updateQueueTracks).toHaveBeenCalledWith(updatedSecond)
	})
})
