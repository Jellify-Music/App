import { PlayerQueue } from 'react-native-nitro-player'
import { clearPlaylists } from '../../../src/player/utils/queue'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../src/services/android-auto/tree'

describe('clearPlaylists', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('deletes phone queues but keeps Android Auto playlists', async () => {
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: 'queue', name: '3f1c…uuid', tracks: [] },
			{ id: 'aa', name: `${AA_PLAYLIST_NAME_PREFIX}On Repeat`, tracks: [] },
		])

		await clearPlaylists()

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('queue')
	})
})
