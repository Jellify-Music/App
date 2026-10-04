import { PlayerQueue, TrackItem } from 'react-native-nitro-player'
import { onChangeTrack } from '../../../src/services/player/utils/event-handlers'
import { setNewQueue, usePlayerQueueStore } from '../../../src/stores/player/queue'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../src/services/android-auto/tree'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: { getState: jest.fn(), setState: jest.fn() },
	setNewQueue: jest.fn(),
}))
jest.mock('../../../src/api/mutations/playback/functions/playback-started', () => jest.fn())
jest.mock('../../../src/api/mutations/playback/functions/playback-progress', () => jest.fn())
jest.mock('../../../src/api/mutations/playback/functions/playback-completed', () => jest.fn())
jest.mock('../../../src/utils/audio/normalization', () => jest.fn().mockResolvedValue(undefined))
jest.mock('../../../src/services/player/utils/auto-download', () => jest.fn())

const track = { id: 'b', title: 'B' } as TrackItem
const setUnshuffledQueue = jest.fn()

beforeEach(() => {
	jest.clearAllMocks()
	;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
		queue: [{ id: 'x' }],
		currentIndex: 0,
		setUnshuffledQueue,
	})
})

it('adopts the native playlist when the playing track is not in the JS queue', async () => {
	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('aa-1')
	;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({
		id: 'aa-1',
		name: `${AA_PLAYLIST_NAME_PREFIX}On Repeat`,
		tracks: [{ id: 'a' }, track],
	})

	await onChangeTrack(track)

	expect(setUnshuffledQueue).toHaveBeenCalledWith([{ id: 'a' }, track])
	expect(setNewQueue).toHaveBeenCalledWith([{ id: 'a' }, track], 'On Repeat', 1, false)
})

const nativePlaylist = (tracks: { id: string }[], name = `${AA_PLAYLIST_NAME_PREFIX}On Repeat`) => {
	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('aa-1')
	;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ id: 'aa-1', name, tracks })
}
const jsQueue = (queue: { id: string }[], currentIndex = 0) =>
	(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
		queue,
		currentIndex,
		setUnshuffledQueue,
	})
/** The currentIndex onChangeTrack wrote to the queue store. */
const storedIndex = () =>
	(usePlayerQueueStore.setState as jest.Mock).mock.calls[0][0]({}).currentIndex

it('adopts an Android Auto playlist even when the track is already in the JS queue', async () => {
	jsQueue([track])
	nativePlaylist([{ id: 'a' }, track])

	await onChangeTrack(track)

	expect(setNewQueue).toHaveBeenCalledWith([{ id: 'a' }, track], 'On Repeat', 1, false)
	expect(storedIndex()).toBe(1)
})

it('does not re-adopt an Android Auto playlist the JS queue already mirrors', async () => {
	jsQueue([{ id: 'a' }, track])
	nativePlaylist([{ id: 'a' }, track])

	await onChangeTrack(track)

	expect(setNewQueue).not.toHaveBeenCalled()
	expect(storedIndex()).toBe(1)
})

it('leaves the queue alone when the track is already in it', async () => {
	jsQueue([track])
	nativePlaylist([{ id: 'a' }, track], 'Restored Playlist')

	await onChangeTrack(track)

	expect(setNewQueue).not.toHaveBeenCalled()
	expect(storedIndex()).toBe(0)
})

describe('keeps the previous index when nothing can be adopted', () => {
	beforeEach(() => jsQueue([{ id: 'x' }, { id: 'y' }], 1))

	it('with no current native playlist', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue(undefined)

		await onChangeTrack(track)

		expect(setNewQueue).not.toHaveBeenCalled()
		expect(storedIndex()).toBe(1)
	})

	it('when the native playlist cannot be read', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('aa-1')
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue(null)

		await onChangeTrack(track)

		expect(setNewQueue).not.toHaveBeenCalled()
		expect(storedIndex()).toBe(1)
	})

	it('when the track is not in the native playlist', async () => {
		nativePlaylist([{ id: 'a' }, { id: 'c' }])

		await onChangeTrack(track)

		expect(setNewQueue).not.toHaveBeenCalled()
		expect(storedIndex()).toBe(1)
	})
})
