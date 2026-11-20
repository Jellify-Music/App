import { downloadItems } from '../../src/hooks/downloads/functions'

type Task = { trackId: string; state: string }

const mockDownloadTrack = jest.fn()
let mockDownloaded: { trackId: string }[] = []
let mockActive: Task[] = []
let mockResolve: (tracks: { id: string }[], source: string, signal?: AbortSignal) => unknown

jest.mock('react-native-nitro-player', () => ({
	DownloadManager: {
		downloadTrack: (track: unknown) => mockDownloadTrack(track),
		getActiveDownloads: () => mockActive,
	},
}))
jest.mock('../../src/hooks/downloads/utils', () => ({
	ensureDownloadedTracks: async () => mockDownloaded,
}))
jest.mock('../../src/utils/fetching/track-media-info', () => ({
	__esModule: true,
	default: (tracks: { id: string }[], source: string, signal?: AbortSignal) =>
		mockResolve(tracks, source, signal),
}))
jest.mock('../../src/utils/mapping/item-to-track', () => ({
	mapDtosToTracks: (items: { Id: string }[]) => items.map((item) => ({ id: item.Id })),
}))

const track = (Id: string) => ({ Id })

const handedOver = () => mockDownloadTrack.mock.calls.map(([t]) => t.id)

describe('downloadItems', () => {
	beforeEach(() => {
		mockDownloadTrack.mockReset()
		mockDownloaded = []
		mockActive = []
		mockResolve = async (tracks) => tracks
	})

	it('hands over every track', async () => {
		await downloadItems([track('1'), track('2')])

		expect(handedOver()).toEqual(['1', '2'])
	})

	it('leaves out what is downloaded already', async () => {
		mockDownloaded = [{ trackId: '1' }]

		await downloadItems([track('1'), track('2')])

		expect(handedOver()).toEqual(['2'])
	})

	it('leaves out what is already downloading or waiting, so asking twice does not queue it twice', async () => {
		mockActive = [
			{ trackId: '1', state: 'downloading' },
			{ trackId: '2', state: 'pending' },
			{ trackId: '3', state: 'failed' },
		]

		await downloadItems([track('1'), track('2'), track('3'), track('4')])

		// a failed download is not under way, so it can be asked for again
		expect(handedOver()).toEqual(['3', '4'])
	})

	it('hands nothing over when told to stop while the playback info was being looked up', async () => {
		const controller = new AbortController()
		mockResolve = async (tracks) => {
			controller.abort()
			return tracks
		}

		await downloadItems([track('1'), track('2')], controller.signal)

		expect(mockDownloadTrack).not.toHaveBeenCalled()
	})

	it('passes the signal on, so that the lookups can stop too', async () => {
		const controller = new AbortController()
		let seen: AbortSignal | undefined
		mockResolve = async (tracks, _source, signal) => {
			seen = signal
			return tracks
		}

		await downloadItems([track('1')], controller.signal)

		expect(seen).toBe(controller.signal)
	})
})
