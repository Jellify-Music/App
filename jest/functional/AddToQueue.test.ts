import { PlayerQueue } from 'react-native-nitro-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getApi } from '../../src/stores/auth/utils'
import playLaterInQueue from '../../src/player/queuing/play-later'
import { getTrackItemId } from '../../src/utils/mapping/track-extra-payload'

jest.mock('../../src/stores/auth/utils')

describe('Play Later - playLaterInQueue', () => {
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
		expect(getTrackItemId(callArg[0])).toBe('t1')
	})

	it('gives each copy of the same track its own queue entry ID', async () => {
		const track: BaseItemDto = {
			Id: 't1',
			Name: 'Test Track',
			Type: 'Audio',
		}

		;(getApi as jest.Mock).mockReturnValue({ basePath: '' })
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)

		await playLaterInQueue({ tracks: [track, track], queuingType: undefined })

		const [first, second] = (PlayerQueue.addTracksToPlaylist as jest.Mock).mock.calls[0][1]
		expect(first.id).not.toBe(second.id)
		expect(first.id).not.toBe('t1')
		expect(getTrackItemId(first)).toBe('t1')
		expect(getTrackItemId(second)).toBe('t1')
	})
})
