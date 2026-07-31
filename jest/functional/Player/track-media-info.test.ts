import { TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { updateTrackMediaInfo } from '../../../src/services/player/utils/track-media-info'
import { onTracksNeedUpdate } from '../../../src/services/player/utils/event-handlers'
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
jest.mock('../../../src/cache/service', () => ({
	cacheService: {
		notifyPlaybackProgress: jest.fn(),
		notifyPlayCompleted: jest.fn(),
	},
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

		expect(resolveTrackUrls).toHaveBeenCalledWith([track], 'stream')
		expect(TrackPlayer.updateTracks).toHaveBeenCalledWith([updatedTrack])
		expect(updateQueueTracks).toHaveBeenCalledWith([updatedTrack])
		expect(result).toEqual([updatedTrack])
	})

	it('concurrent calls both complete and each updates the player and queue store', async () => {
		const firstTracks = [createTrack('a', '')]
		const secondTracks = [createTrack('b', '')]
		const updatedFirst = [createTrack('a', 'https://cdn.example.com/a.mp3')]
		const updatedSecond = [createTrack('b', 'https://cdn.example.com/b.mp3')]

		const firstDeferred = deferred<TrackItem[]>()
		;(resolveTrackUrls as jest.Mock)
			.mockReturnValueOnce(firstDeferred.promise)
			.mockResolvedValueOnce(updatedSecond)

		const firstCall = updateTrackMediaInfo(firstTracks)
		await updateTrackMediaInfo(secondTracks)

		firstDeferred.resolve(updatedFirst)
		await firstCall

		expect(TrackPlayer.updateTracks).toHaveBeenCalledTimes(2)
		expect(updateQueueTracks).toHaveBeenCalledTimes(2)
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

	it('only resolves tracks up to the lookahead count, not the full list', async () => {
		const tracks = ['a', 'b', 'c', 'd', 'e'].map((id) => createTrack(id, ''))
		const updatedSlice = tracks.slice(0, 2).map((t) => ({ ...t, url: `https://cdn/${t.id}` }))
		;(resolveTrackUrls as jest.Mock).mockResolvedValue(updatedSlice)

		await onTracksNeedUpdate(tracks, 2)

		expect(resolveTrackUrls).toHaveBeenCalledWith(tracks.slice(0, 2), 'stream')
	})

	it('passes all tracks when the lookahead equals or exceeds the track count', async () => {
		const tracks = ['a', 'b'].map((id) => createTrack(id, ''))
		;(resolveTrackUrls as jest.Mock).mockResolvedValue(tracks)

		await onTracksNeedUpdate(tracks, 10)

		expect(resolveTrackUrls).toHaveBeenCalledWith(tracks, 'stream')
	})
})
