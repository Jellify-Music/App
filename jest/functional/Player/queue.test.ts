import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { loadNewQueue, reorderQueue } from '../../../src/hooks/player/functions/queue'
import { setNewQueue, usePlayerQueueStore } from '../../../src/stores/player/queue'
import { mapDtoToTrack } from '../../../src/utils/mapping/item-to-track'
import { filterTracksOnNetworkStatus } from '../../../src/hooks/player/functions/utils/queue'
import { useNetworkStore } from '../../../src/stores/network'
import resolveTrackUrls from '../../../src/utils/fetching/track-media-info'
import { updateTrackMediaInfo } from '../../../src/providers/Player/utils/event-handlers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
	setNewQueue: jest.fn(),
}))

jest.mock('../../../src/utils/mapping/item-to-track', () => ({
	mapDtoToTrack: jest.fn(),
}))

jest.mock('../../../src/hooks/player/functions/utils/queue', () => ({
	clearPlaylists: jest.fn().mockResolvedValue(undefined),
	filterTracksOnNetworkStatus: jest.fn(),
}))

jest.mock('../../../src/stores/network', () => ({
	useNetworkStore: { getState: jest.fn() },
}))

jest.mock('../../../src/utils/fetching/track-media-info', () => ({
	__esModule: true,
	default: jest.fn(),
}))

jest.mock('../../../src/providers/Player/utils/event-handlers', () => ({
	updateTrackMediaInfo: jest.fn(),
}))

jest.mock('react-native-uuid', () => ({
	__esModule: true,
	default: { v4: jest.fn().mockReturnValue('test-uuid') },
}))

jest.mock('../../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

const createTrack = (id: string): TrackItem =>
	({
		id,
		title: id,
		artist: 'Artist',
		album: 'Album',
		duration: 180,
		url: `https://example.com/${id}.mp3`,
		sessionId: 'TEST_SESSION_ID',
		extraPayload: {
			sourceType: 'stream',
			sessionId: 'TEST_SESSION_ID',
		},
	}) as TrackItem

describe('Queue - loadNewQueue', () => {
	const createDto = (id: string): BaseItemDto =>
		({ Id: id, Name: `Track ${id}`, RunTimeTicks: 1_800_000_000 }) as BaseItemDto

	const createTrackItem = (id: string, url = ''): TrackItem =>
		({
			id,
			title: `Track ${id}`,
			artist: 'Artist',
			album: 'Album',
			duration: 180,
			url,
			extraPayload: { sessionId: '', mediaSourceInfo: '{}', item: '{}' },
		}) as unknown as TrackItem

	let mockSetIsQueuing: jest.Mock
	let mockSetUnshuffledQueue: jest.Mock

	beforeEach(() => {
		jest.clearAllMocks()

		mockSetIsQueuing = jest.fn()
		mockSetUnshuffledQueue = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			setIsQueuing: mockSetIsQueuing,
			setUnshuffledQueue: mockSetUnshuffledQueue,
		})
		;(useNetworkStore.getState as jest.Mock).mockReturnValue({ networkStatus: 'ONLINE' })
		;(PlayerQueue.createPlaylist as jest.Mock).mockResolvedValue('test-playlist-id')
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.loadPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getTracksNeedingUrls as jest.Mock).mockResolvedValue([])
		;(updateTrackMediaInfo as jest.Mock).mockResolvedValue([])
	})

	it('calls skipToIndex(0) when the starting index is 0', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(0)
	})

	it('calls skipToIndex with the correct non-zero starting index', async () => {
		const dtos = [createDto('a'), createDto('b'), createDto('c')]
		const tracks = dtos.map((d) => createTrackItem(d.Id!, `https://example.com/${d.Id}.mp3`))
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation(async (dto: BaseItemDto) =>
			tracks.find((t) => t.id === dto.Id),
		)
		;(resolveTrackUrls as jest.Mock).mockImplementation(async (items: TrackItem[]) => items)

		await loadNewQueue({
			track: dtos[2],
			index: 2,
			tracklist: dtos,
			queue: 'Library',
			startPlayback: false,
		})

		expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(2)
	})

	it('proactively resolves the starting stream track URL before adding to the playlist', async () => {
		const dto = createDto('a')
		const trackWithoutUrl = createTrackItem('a', '')
		const resolvedTrack = createTrackItem('a', 'https://example.com/a.mp3')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(trackWithoutUrl)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([resolvedTrack])

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(resolveTrackUrls).toHaveBeenCalledWith([trackWithoutUrl], 'stream')
		const addedTracks = (PlayerQueue.addTracksToPlaylist as jest.Mock).mock.calls[0][1]
		expect(addedTracks[0].url).toBe('https://example.com/a.mp3')
	})

	it('skips proactive URL resolution for a downloaded starting track', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', '')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([{ trackId: 'a' }])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(resolveTrackUrls).not.toHaveBeenCalled()
	})

	it('resolves remaining tracks that need URLs via updateTrackMediaInfo after loading the playlist', async () => {
		const dtos = [createDto('a'), createDto('b')]
		const trackA = createTrackItem('a', '')
		const trackB = createTrackItem('b', '')
		const resolvedB = createTrackItem('b', 'https://example.com/b.mp3')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([{ trackId: 'a' }])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation(async (dto: BaseItemDto) =>
			dto.Id === 'a' ? trackA : trackB,
		)
		;(TrackPlayer.getTracksNeedingUrls as jest.Mock).mockResolvedValue([trackB])
		;(updateTrackMediaInfo as jest.Mock).mockResolvedValue([resolvedB])

		await loadNewQueue({
			track: dtos[0],
			index: 0,
			tracklist: dtos,
			queue: 'Library',
			startPlayback: false,
		})

		expect(updateTrackMediaInfo).toHaveBeenCalledWith([trackB])
	})

	it('passes URL-resolved tracks from updateTrackMediaInfo to setNewQueue', async () => {
		const dtos = [createDto('a'), createDto('b')]
		const trackA = createTrackItem('a', 'https://example.com/a.mp3')
		const trackB = createTrackItem('b', '')
		const resolvedB = createTrackItem('b', 'https://example.com/b.mp3')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation(async (dto: BaseItemDto) =>
			dto.Id === 'a' ? trackA : trackB,
		)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([trackA])
		;(TrackPlayer.getTracksNeedingUrls as jest.Mock).mockResolvedValue([trackB])
		;(updateTrackMediaInfo as jest.Mock).mockResolvedValue([resolvedB])

		await loadNewQueue({
			track: dtos[0],
			index: 0,
			tracklist: dtos,
			queue: 'Library',
			startPlayback: false,
		})

		expect(setNewQueue).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ id: 'a', url: 'https://example.com/a.mp3' }),
				expect.objectContaining({ id: 'b', url: 'https://example.com/b.mp3' }),
			]),
			'Library',
			0,
			false,
		)
	})

	it('calls setNewQueue after skipToIndex and URL resolution', async () => {
		const callOrder: string[] = []
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])
		;(TrackPlayer.skipToIndex as jest.Mock).mockImplementation(async () => {
			callOrder.push('skipToIndex')
		})
		;(TrackPlayer.getTracksNeedingUrls as jest.Mock).mockImplementation(async () => {
			callOrder.push('getTracksNeedingUrls')
			return []
		})
		;(setNewQueue as jest.Mock).mockImplementation(() => {
			callOrder.push('setNewQueue')
		})

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(callOrder).toEqual(['skipToIndex', 'getTracksNeedingUrls', 'setNewQueue'])
	})

	it('calls TrackPlayer.play() when startPlayback is true', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: true,
		})

		expect(TrackPlayer.play).toHaveBeenCalled()
	})

	it('calls TrackPlayer.play() after setNewQueue so the queue is ready before playback starts', async () => {
		const callOrder: string[] = []
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])
		;(setNewQueue as jest.Mock).mockImplementation(() => {
			callOrder.push('setNewQueue')
		})
		;(TrackPlayer.play as jest.Mock).mockImplementation(async () => {
			callOrder.push('play')
		})

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: true,
		})

		expect(callOrder).toEqual(['setNewQueue', 'play'])
	})

	it('does not call TrackPlayer.play() when startPlayback is false', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockResolvedValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(TrackPlayer.play).not.toHaveBeenCalled()
	})
})

describe('Queue - reorderQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('updates currentIndex by current track id after reorder', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')
		const trackD = createTrack('d')

		const prevQueue = [trackA, trackB, trackC, trackD]
		const reorderedQueue = [trackB, trackC, trackD, trackA]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			queue: prevQueue,
			currentIndex: 2,
		})
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks: prevQueue })
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(reorderedQueue)

		await reorderQueue({ fromIndex: 0, toIndex: 3 })

		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'a', 3)
		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls[0][0]
		const nextState = stateUpdater({ queue: prevQueue, currentIndex: 2 })

		expect(nextState.queue).toEqual(reorderedQueue)
		expect(nextState.currentIndex).toBe(1)
	})

	it('falls back to previous index if current track is missing in updated queue', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')

		const prevQueue = [trackA, trackB, trackC]
		const updatedQueueWithoutCurrent = [trackA, trackB]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			queue: prevQueue,
			currentIndex: 2,
		})
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks: prevQueue })
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(updatedQueueWithoutCurrent)

		await reorderQueue({ fromIndex: 0, toIndex: 1 })

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls[0][0]
		const nextState = stateUpdater({ queue: prevQueue, currentIndex: 2 })

		expect(nextState.queue).toEqual(updatedQueueWithoutCurrent)
		expect(nextState.currentIndex).toBe(2)
		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
	})

	it('returns early when there is no active playlist', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue(undefined)

		await reorderQueue({ fromIndex: 0, toIndex: 1 })

		expect(PlayerQueue.getPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.reorderTrackInPlaylist).not.toHaveBeenCalled()
		expect(TrackPlayer.getActualQueue).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).not.toHaveBeenCalled()
	})
})
