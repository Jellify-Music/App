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

it('leaves the queue alone when the track is already in it', async () => {
	;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
		queue: [track],
		currentIndex: 0,
		setUnshuffledQueue,
	})

	await onChangeTrack(track)

	expect(setNewQueue).not.toHaveBeenCalled()
})
