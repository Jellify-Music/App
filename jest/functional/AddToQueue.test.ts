import TrackPlayer from 'react-native-track-player'
import { playLaterInQueue } from '../../src/providers/Player/functions/queue'
import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'

describe('Add to Queue - playLaterInQueue', () => {
	it('adds track to the end of the queue', async () => {
		const track: BaseItemDto = {
			Id: 't1',
			Name: 'Test Track',
			// Intentionally exclude AlbumId to avoid image URL building
			Type: 'Audio',
		}

		// Mock getQueue to return updated list after add
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([{ item: track }])

		const api: Partial<Api> = { basePath: '' }
		const deviceProfile: Partial<DeviceProfile> = { Name: 'test' }

		await playLaterInQueue({
			api: api as Api,
			deviceProfile: deviceProfile as DeviceProfile,
			networkStatus: null,
			tracks: [track],
			queuingType: undefined,
		})

		expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
		const callArg = (TrackPlayer.add as jest.Mock).mock.calls[0][0]
		expect(Array.isArray(callArg)).toBe(true)
		expect(callArg[0].item.Id).toBe('t1')
	})
})
