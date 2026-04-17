import { PlayerQueue } from 'react-native-nitro-player'
import { playLaterInQueue } from '../../src/hooks/player/functions/queue'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getApi } from '../../src/stores'

jest.mock('../../src/stores')

describe('Add to Queue - playLaterInQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('adds track to the end of the queue', async () => {
		const track: BaseItemDto = {
			Id: 't1',
			Name: 'Test Track',
			// Intentionally exclude AlbumId to avoid image URL building
			Type: 'Audio',
		}

		// Mock the Api instance
		const mockApi = {
			basePath: '',
		}

		;(getApi as jest.Mock).mockReturnValue(mockApi)
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks: [] })

		await playLaterInQueue({
			tracks: [track],
			queuingType: undefined,
		})

		const callArg = (PlayerQueue.addTracksToPlaylist as jest.Mock).mock.calls[0][1]
		expect(Array.isArray(callArg)).toBe(true)
		expect(callArg[0].id).toBe('t1')
	})
})
