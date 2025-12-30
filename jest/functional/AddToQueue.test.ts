import TrackPlayer from 'react-native-track-player'
import { playLaterInQueue } from '../../src/providers/Player/functions/queue'
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

		// Mock getQueue to return updated list after add
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([{ item: track }])

		await playLaterInQueue({
			tracks: [track],
			queuingType: undefined,
		})

		expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
		const callArg = (TrackPlayer.add as jest.Mock).mock.calls[0][0]
		expect(Array.isArray(callArg)).toBe(true)
		expect(callArg[0].item.Id).toBe('t1')
	})
})
