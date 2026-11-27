import { cancelDownloadsOf, isActiveDownload } from '../../src/hooks/downloads/functions/cancel'

type Task = { trackId: string; downloadId: string; state: string }

let mockTasks: Task[] = []
const mockCancel = jest.fn<Promise<void>, [string]>()

jest.mock('react-native-nitro-player', () => ({
	DownloadManager: {
		getActiveDownloads: () => mockTasks,
		cancelDownload: (id: string) => mockCancel(id),
	},
}))

describe('isActiveDownload', () => {
	it.each([
		['pending', true],
		['downloading', true],
		['paused', true],
		['completed', false],
		['failed', false],
		['cancelled', false],
	])('%s is %s', (state, expected) => {
		expect(isActiveDownload({ state } as never)).toBe(expected)
	})
})

describe('cancelDownloadsOf', () => {
	beforeEach(() => {
		mockTasks = []
		mockCancel.mockReset().mockResolvedValue(undefined)
	})

	it('cancels the running and waiting downloads of the tracks, and nothing else', async () => {
		mockTasks = [
			{ trackId: '1', downloadId: 'd1', state: 'downloading' },
			{ trackId: '2', downloadId: 'd2', state: 'pending' },
			{ trackId: '3', downloadId: 'd3', state: 'paused' },
			{ trackId: '4', downloadId: 'd4', state: 'completed' },
			{ trackId: 'other', downloadId: 'd5', state: 'downloading' },
		]

		await cancelDownloadsOf(new Set(['1', '2', '3', '4']))

		expect(mockCancel.mock.calls.map(([id]) => id).sort()).toEqual(['d1', 'd2', 'd3'])
	})

	it('does nothing when there is nothing to cancel', async () => {
		await cancelDownloadsOf(new Set(['1']))

		expect(mockCancel).not.toHaveBeenCalled()
	})

	it('carries on, and does not fail, when one cannot be cancelled', async () => {
		mockTasks = [
			{ trackId: '1', downloadId: 'd1', state: 'downloading' },
			{ trackId: '2', downloadId: 'd2', state: 'downloading' },
		]
		mockCancel.mockRejectedValueOnce(new Error('already finished'))

		await expect(cancelDownloadsOf(new Set(['1', '2']))).resolves.toBeUndefined()

		expect(mockCancel).toHaveBeenCalledTimes(2)
	})
})
