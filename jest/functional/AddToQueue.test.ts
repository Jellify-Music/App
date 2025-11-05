import PlayerNative, { TrackType } from '../../src/providers/Player/native'
import { playLaterInQueue } from '../../src/providers/Player/functions/queue'
import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { JellifyDownload } from '@/src/types/JellifyDownload'
import { usePlayerQueueStore } from '../../src/stores/player/queue'

describe('Add to Queue - playLaterInQueue', () => {
	it('adds track to the end of the queue', async () => {
		const track: BaseItemDto = {
			Id: 't1',
			Name: 'Test Track',
			// Intentionally exclude AlbumId to avoid image URL building
			Type: 'Audio',
		}

		// Mock getQueue to return updated list after add
		;(PlayerNative.getQueue as jest.Mock).mockResolvedValue([{ item: track }])

		const api: Partial<Api> = { basePath: '' }
		const deviceProfile: Partial<DeviceProfile> = { Name: 'test' }

		const downloaded: JellifyDownload = {
			// Minimal viable JellifyTrack fields
			url: '/downloads/t1.mp3',
			duration: 180,
			type: TrackType.Default,
			item: track,
			sessionId: null,
			sourceType: 'download',
			artwork: '/downloads/t1.jpg',
			// JellifyDownload fields
			savedAt: new Date().toISOString(),
			isAutoDownloaded: false,
			path: '/downloads/t1.mp3',
		}

		// Reset store before action
		usePlayerQueueStore.getState().setQueue([])
		usePlayerQueueStore.getState().setUnshuffledQueue([])

		await playLaterInQueue({
			api: api as Api,
			deviceProfile: deviceProfile as DeviceProfile,
			networkStatus: null,
			tracks: [track],
			queuingType: undefined,
			downloadedTracks: [downloaded],
		})

		// RNTP add is called with sanitized items (without `item`),
		// so validate app-level queue retains full JellifyTrack in store
		const state = usePlayerQueueStore.getState()
		expect(state.unShuffledQueue.length).toBeGreaterThan(0)
		const lastQueued = state.unShuffledQueue[state.unShuffledQueue.length - 1]
		expect(lastQueued.item.Id).toBe('t1')
		expect(lastQueued.sourceType).toBe('download')
	})
})
