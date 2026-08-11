import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import {
	loadNewQueue,
	reorderQueue,
	playNextInQueue,
	playLaterInQueue,
	addToQueue,
} from '../../../src/hooks/player/functions/queue'
import { setNewQueue, usePlayerQueueStore } from '../../../src/stores/player/queue'
import { mapDtoToTrack, mapDtosToTracks } from '../../../src/utils/mapping/item-to-track'
import { filterTracksOnNetworkStatus } from '../../../src/hooks/player/functions/utils/queue'
import { useNetworkStore } from '../../../src/stores/network'
import resolveTrackUrls from '../../../src/utils/fetching/track-media-info'
import { updateTrackMediaInfo } from '../../../src/services/player/utils/track-media-info'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueuingType } from '../../../src/enums/queuing-type'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
	setNewQueue: jest.fn(),
}))

jest.mock('../../../src/utils/mapping/item-to-track', () => ({
	mapDtoToTrack: jest.fn(),
	mapDtosToTracks: jest.fn(),
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

jest.mock('../../../src/services/player/utils/track-media-info', () => ({
	updateTrackMediaInfo: jest.fn(),
}))

jest.mock('react-native-uuid', () => ({
	__esModule: true,
	default: { v4: jest.fn().mockReturnValue('test-uuid') },
}))

jest.mock('../../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

jest.mock('../../../src/hooks/downloads/utils', () => ({
	ensureDownloadedTracks: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../../src/utils/haptics', () => ({
	applyHapticFeedback: jest.fn(),
}))

jest.mock('react-native-toast-message', () => ({
	show: jest.fn(),
	hide: jest.fn(),
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
		;(mapDtosToTracks as jest.Mock).mockImplementation((items: BaseItemDto[]) =>
			items.map((item) => (mapDtoToTrack as jest.Mock)(item)),
		)
	})

	it('does not call skipToIndex when starting index is 0', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockReturnValue(track)
		;(resolveTrackUrls as jest.Mock).mockResolvedValue([track])

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
	})

	it('does not call skipToIndex for a non-zero starting index', async () => {
		const dtos = [createDto('a'), createDto('b'), createDto('c')]
		const tracks = dtos.map((d) => createTrackItem(d.Id!, `https://example.com/${d.Id}.mp3`))
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation((dto: BaseItemDto) =>
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

		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
	})

	it('does not call updateTrackMediaInfo directly when starting track URL is empty (resolved by native onTracksNeedUpdate)', async () => {
		const dto = createDto('a')
		const trackWithoutUrl = createTrackItem('a', '')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockReturnValue(trackWithoutUrl)

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(resolveTrackUrls).not.toHaveBeenCalled()
		expect(updateTrackMediaInfo).not.toHaveBeenCalled()
	})

	it('does not call updateTrackMediaInfo for a downloaded starting track that already has a local URL', async () => {
		const dto = createDto('a')
		const downloadedTrack = createTrackItem('a', 'file:///local/path/a.mp3')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([{ trackId: 'a' }])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockReturnValue(downloadedTrack)

		await loadNewQueue({
			track: dto,
			index: 0,
			tracklist: [dto],
			queue: 'Library',
			startPlayback: false,
		})

		expect(resolveTrackUrls).not.toHaveBeenCalled()
		expect(updateTrackMediaInfo).not.toHaveBeenCalled()
	})

	it('does not call updateTrackMediaInfo directly when all track URLs are empty (resolved by native onTracksNeedUpdate)', async () => {
		const dtos = [createDto('a'), createDto('b')]
		const trackA = createTrackItem('a', '')
		const trackB = createTrackItem('b', '')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation((dto: BaseItemDto) =>
			dto.Id === 'a' ? trackA : trackB,
		)

		await loadNewQueue({
			track: dtos[0],
			index: 0,
			tracklist: dtos,
			queue: 'Library',
			startPlayback: false,
		})

		expect(updateTrackMediaInfo).not.toHaveBeenCalled()
		expect(setNewQueue).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ id: 'a', url: '' }),
				expect.objectContaining({ id: 'b', url: '' }),
			]),
			'Library',
			0,
			false,
		)
	})

	it('passes mapped tracks directly to setNewQueue', async () => {
		const dtos = [createDto('a'), createDto('b')]
		const trackA = createTrackItem('a', 'https://example.com/a.mp3')
		const trackB = createTrackItem('b', '')
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation((dto: BaseItemDto) =>
			dto.Id === 'a' ? trackA : trackB,
		)

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
				expect.objectContaining({ id: 'b', url: '' }),
			]),
			'Library',
			0,
			false,
		)
	})

	it('passes the correct start index to loadPlaylist for non-zero starting index', async () => {
		const dtos = [createDto('a'), createDto('b'), createDto('c')]
		const tracks = dtos.map((d) => createTrackItem(d.Id!, `https://example.com/${d.Id}.mp3`))
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue(dtos)
		;(mapDtoToTrack as jest.Mock).mockImplementation((dto: BaseItemDto) =>
			tracks.find((t) => t.id === dto.Id),
		)

		await loadNewQueue({
			track: dtos[2],
			index: 2,
			tracklist: dtos,
			queue: 'Library',
			startPlayback: false,
		})

		expect(PlayerQueue.loadPlaylist).toHaveBeenCalledWith(expect.any(String), 2)
	})

	it('calls TrackPlayer.play() when startPlayback is true', async () => {
		const dto = createDto('a')
		const track = createTrackItem('a', 'https://example.com/a.mp3')
		;(filterTracksOnNetworkStatus as jest.Mock).mockReturnValue([dto])
		;(mapDtoToTrack as jest.Mock).mockReturnValue(track)
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
		;(mapDtoToTrack as jest.Mock).mockReturnValue(track)
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
		;(mapDtoToTrack as jest.Mock).mockReturnValue(track)
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

describe('Queue - playNextInQueue', () => {
	let mockGetState: jest.Mock
	let mockSetState: jest.Mock

	beforeEach(() => {
		jest.clearAllMocks()

		mockGetState = jest.fn()
		mockSetState = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockImplementation(mockGetState)
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(mockSetState)
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockResolvedValue('playlist-1')
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])
		;(mapDtosToTracks as jest.Mock).mockImplementation((dtos: BaseItemDto[]) =>
			dtos.map((dto) => createTrack(dto.Id!)),
		)
	})

	it('reorders existing tracks to play next position', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA, trackB, trackC],
			unShuffledQueue: [trackA, trackB, trackC],
		})

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should call reorderTrackInPlaylist for track 'b' at position 1 (currentIndex + 1)
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'b', 1)
		// Should NOT call addTracksToPlaylist because track b is already in queue
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()
	})

	it('adds new tracks to the queue at insert index', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA],
			unShuffledQueue: [trackA],
		})

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should NOT call reorderTrackInPlaylist because track b is not in queue
		expect(PlayerQueue.reorderTrackInPlaylist).not.toHaveBeenCalled()
		// Should call addTracksToPlaylist with insertIndex 1 (currentIndex + 1)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.any(Array),
			1,
		)
	})

	it('handles mixed tracks: reorder existing and add new', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA, trackB],
			unShuffledQueue: [trackA, trackB],
		})

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto, { Id: 'c' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should reorder track 'b' at position 1
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'b', 1)
		// Should add track 'c' at position 1
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.arrayContaining([expect.objectContaining({ id: 'c' })]),
			1,
		)
	})

	it('uses Promise.all for parallel reordering of multiple existing tracks', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')
		const trackD = createTrack('d')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA, trackB, trackC, trackD],
			unShuffledQueue: [trackA, trackB, trackC, trackD],
		})

		const dtos: BaseItemDto[] = [{ Id: 'c' } as BaseItemDto, { Id: 'd' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should reorder both tracks with correct offsets
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'c', 1)
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'd', 2)
		// Should be called exactly twice
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledTimes(2)
	})

	it('calculates correct insert index with currentIndex in middle of queue', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')
		const trackD = createTrack('d')

		mockGetState.mockReturnValue({
			currentIndex: 1,
			queue: [trackA, trackB, trackC, trackD],
			unShuffledQueue: [trackA, trackB, trackC, trackD],
		})

		const dtos: BaseItemDto[] = [{ Id: 'e' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should insert at currentIndex + 1 = 2
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.any(Array),
			2,
		)
	})

	it('calculates correct insert index with currentIndex at end of queue', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')

		mockGetState.mockReturnValue({
			currentIndex: 2,
			queue: [trackA, trackB, trackC],
			unShuffledQueue: [trackA, trackB, trackC],
		})

		const dtos: BaseItemDto[] = [{ Id: 'd' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should insert at end of queue (3) instead of beyond it
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.any(Array),
			3,
		)
	})

	it('calculates insert index at 0 when no currentIndex', async () => {
		mockGetState.mockReturnValue({
			currentIndex: undefined,
			queue: [],
			unShuffledQueue: [],
		})

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		// Should insert at 0
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.any(Array),
			0,
		)
	})

	it('warns and returns early when no active playlist', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockResolvedValue(null)

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		expect(consoleSpy).toHaveBeenCalledWith('playNextInQueue: No active playlist to add to')
		expect(PlayerQueue.reorderTrackInPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()

		consoleSpy.mockRestore()
	})

	it('updates Zustand state with updated queue after operation', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')
		const updatedQueue = [trackB, trackA, trackC]

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA, trackB, trackC],
			unShuffledQueue: [trackA, trackB, trackC],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(updatedQueue)

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await playNextInQueue({ tracks: dtos, queuingType: QueuingType.PlayNext })

		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = mockSetState.mock.calls[0][0]
		const nextState = stateUpdater({
			unShuffledQueue: [trackA, trackB, trackC],
		})

		expect(nextState.queue).toEqual(updatedQueue)
		// newTracks (track b) is appended to unShuffledQueue
		expect(nextState.unShuffledQueue).toEqual([trackA, trackB, trackC, trackB])
	})
})

describe('Queue - playLaterInQueue', () => {
	let mockGetState: jest.Mock
	let mockSetState: jest.Mock

	beforeEach(() => {
		jest.clearAllMocks()

		mockGetState = jest.fn()
		mockSetState = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockImplementation(mockGetState)
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(mockSetState)
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockResolvedValue('playlist-1')
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])
		;(mapDtosToTracks as jest.Mock).mockImplementation((dtos: BaseItemDto[]) =>
			dtos.map((dto) => createTrack(dto.Id!)),
		)
	})

	it('adds tracks to the end of the queue', async () => {
		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await playLaterInQueue({ tracks: dtos, queuingType: QueuingType.PlayLater })

		// Should call addTracksToPlaylist without insert index (appends to end)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.any(Array),
		)
	})

	it('warns and returns early when no active playlist', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockResolvedValue(null)

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await playLaterInQueue({ tracks: dtos, queuingType: QueuingType.PlayLater })

		expect(consoleSpy).toHaveBeenCalledWith('playLaterInQueue: No active playlist to add to')
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()

		consoleSpy.mockRestore()
	})

	it('updates Zustand state with updated queue after operation', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const updatedQueue = [trackA, trackB]

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA],
			unShuffledQueue: [trackA],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(updatedQueue)

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await playLaterInQueue({ tracks: dtos, queuingType: QueuingType.PlayLater })

		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = mockSetState.mock.calls[0][0]
		const nextState = stateUpdater({ unShuffledQueue: [trackA] })

		expect(nextState.queue).toEqual(updatedQueue)
		expect(nextState.unShuffledQueue).toEqual([trackA, trackB])
	})
})

describe('Queue - addToQueue', () => {
	let mockGetState: jest.Mock
	let mockSetState: jest.Mock

	beforeEach(() => {
		jest.clearAllMocks()

		mockGetState = jest.fn()
		mockSetState = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockImplementation(mockGetState)
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(mockSetState)
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockResolvedValue('playlist-1')
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])
		;(mapDtosToTracks as jest.Mock).mockImplementation((dtos: BaseItemDto[]) =>
			dtos.map((dto) => createTrack(dto.Id!)),
		)
	})

	it('calls playNextInQueue with all tracks for PlayNext queuing type', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA],
			unShuffledQueue: [trackA],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([trackA])

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		// Should allow reordering by not filtering
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalled()
	})

	it('filters out existing tracks for PlayLater queuing type', async () => {
		const trackA = createTrack('a')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA],
			unShuffledQueue: [trackA],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([trackA])

		const dtos: BaseItemDto[] = [
			{ Id: 'a' } as BaseItemDto, // already in queue
			{ Id: 'b' } as BaseItemDto, // new track
		]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayLater,
		})

		// Should only add track 'b', not 'a'
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
			'playlist-1',
			expect.arrayContaining([expect.objectContaining({ id: 'b' })]),
		)
	})

	it('reorders existing track when added with PlayNext queuing type', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [trackA, trackB],
			unShuffledQueue: [trackA, trackB],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([trackA, trackB])

		const dtos: BaseItemDto[] = [{ Id: 'b' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		// Should reorder track 'b' instead of adding
		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'b', 1)
	})

	it('shows success toast on successful operation', async () => {
		const mockToast = require('react-native-toast-message')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		expect(mockToast.show).toHaveBeenCalledWith({
			text1: 'Playing next',
			type: 'success',
		})
	})

	it('shows error toast on failure for PlayNext', async () => {
		const mockToast = require('react-native-toast-message')

		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockRejectedValue(new Error('Test error'))

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		expect(mockToast.show).toHaveBeenCalledWith({
			text1: 'Failed to play next',
			type: 'error',
		})
	})

	it('shows error toast on failure for PlayLater', async () => {
		const mockToast = require('react-native-toast-message')

		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockRejectedValue(new Error('Test error'))

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayLater,
		})

		expect(mockToast.show).toHaveBeenCalledWith({
			text1: 'Failed to add to queue',
			type: 'error',
		})
	})

	it('applies haptic feedback on success', async () => {
		const mockHaptics = require('../../../src/utils/haptics')

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		expect(mockHaptics.applyHapticFeedback).toHaveBeenCalledWith('success')
	})

	it('applies error haptic feedback on failure', async () => {
		const mockHaptics = require('../../../src/utils/haptics')

		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockRejectedValue(new Error('Test error'))

		mockGetState.mockReturnValue({
			currentIndex: 0,
			queue: [],
			unShuffledQueue: [],
		})

		const dtos: BaseItemDto[] = [{ Id: 'a' } as BaseItemDto]

		await addToQueue({
			tracks: dtos,
			queuingType: QueuingType.PlayNext,
		})

		expect(mockHaptics.applyHapticFeedback).toHaveBeenCalledWith('error')
	})
})
