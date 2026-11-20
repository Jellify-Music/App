import { downloadItems } from '../../src/hooks/downloads/functions'
import useDownloadQueueStore from '../../src/stores/download-queue'

const mockDownloadTrack = jest.fn()
let mockDownloaded: { trackId: string }[] = []

jest.mock('react-native-nitro-player', () => ({
	DownloadManager: { downloadTrack: (track: unknown) => mockDownloadTrack(track) },
}))
jest.mock('../../src/hooks/downloads/utils', () => ({
	ensureDownloadedTracks: async () => mockDownloaded,
}))
jest.mock('../../src/utils/fetching/track-media-info', () => ({
	__esModule: true,
	default: async (tracks: unknown[]) => tracks,
}))
jest.mock('../../src/utils/mapping/item-to-track', () => ({
	mapDtosToTracks: (items: { Id: string }[]) => items.map((item) => ({ id: item.Id })),
}))
jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const track = (Id: string) => ({ Id, Name: `Track ${Id}`, AlbumId: 'a', Album: 'Echo' })

describe('downloadItems', () => {
	beforeEach(() => {
		mockDownloadTrack.mockReset()
		mockDownloaded = []
		useDownloadQueueStore.setState({ entries: {} })
	})

	it('notes what each track belongs to as it queues them', async () => {
		await downloadItems([track('1'), track('2')])

		const entries = useDownloadQueueStore.getState().entries
		expect(Object.keys(entries)).toEqual(['1', '2'])
		expect(entries['1']).toMatchObject({ albumId: 'a', album: 'Echo', done: false })
		expect(mockDownloadTrack).toHaveBeenCalledTimes(2)
	})

	it('leaves out what is downloaded already, as the downloader is', async () => {
		mockDownloaded = [{ trackId: '1' }]

		await downloadItems([track('1'), track('2')])

		expect(Object.keys(useDownloadQueueStore.getState().entries)).toEqual(['2'])
		expect(mockDownloadTrack).toHaveBeenCalledTimes(1)
	})
})
