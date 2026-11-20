import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useCollectionDownload } from '../../src/hooks/downloads/collection'

let mockDownloaded = new Set<string>()
let mockActive: { trackId: string; state: string; downloadId?: string }[] = []
let mockProgressMap = new Map<string, { progress: number }>()
const mockDownloadItems = jest.fn<Promise<void>, [BaseItemDto[], AbortSignal | undefined]>()
const mockCancelDownload = jest.fn<Promise<void>, [string]>()
const mockDeleteDownloads = jest.fn()

jest.mock('../../src/hooks/downloads', () => ({
	useDownloadedIds: () => mockDownloaded,
}))
jest.mock('../../src/hooks/downloads/functions', () => ({
	downloadItems: (items: BaseItemDto[], signal?: AbortSignal) => mockDownloadItems(items, signal),
}))
jest.mock('../../src/hooks/downloads/mutations', () => ({
	useDeleteDownloads: () => ({ mutate: mockDeleteDownloads }),
}))
jest.mock('react-native-nitro-player', () => ({
	useDownloadProgress: () => ({ progressMap: mockProgressMap }),
	DownloadManager: {
		getActiveDownloads: () => mockActive,
		cancelDownload: (id: string) => mockCancelDownload(id),
	},
}))

const tracks = (count: number): BaseItemDto[] =>
	Array.from({ length: count }, (_, i) => ({ Id: `track-${i}` }))

const ids = (items: BaseItemDto[]) => items.map((item) => item.Id)

// the hook starts a mutation, which keeps a timer: a client per test, cleared after
const clients: QueryClient[] = []
const unmounts: (() => void)[] = []

async function setup(collection: BaseItemDto[] | undefined) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { gcTime: 0 } },
	})
	clients.push(client)

	const hook = await renderHook(() => useCollectionDownload(collection), {
		wrapper: ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
	unmounts.push(hook.unmount)

	return hook
}

describe('useCollectionDownload', () => {
	beforeEach(() => {
		mockDownloaded = new Set()
		mockActive = []
		mockProgressMap = new Map()
		mockDownloadItems.mockReset().mockResolvedValue(undefined)
		mockCancelDownload.mockReset().mockResolvedValue(undefined)
		mockDeleteDownloads.mockReset()
	})

	afterEach(() => {
		unmounts.splice(0).forEach((unmount) => unmount())
		clients.splice(0).forEach((client) => client.clear())
	})

	it('is loading until the tracks are known', async () => {
		const { result } = await setup(undefined)

		expect(result.current.state).toBe('loading')
	})

	it('is empty when there are no tracks', async () => {
		const { result } = await setup([])

		expect(result.current.state).toBe('empty')
	})

	it('is ready, and downloads only the tracks that are not downloaded', async () => {
		const all = tracks(5)
		mockDownloaded = new Set(['track-0', 'track-1'])
		const { result } = await setup(all)

		expect(result.current.state).toBe('ready')

		await act(async () => result.current.download())

		await waitFor(() => expect(mockDownloadItems).toHaveBeenCalledTimes(1))
		expect(ids(mockDownloadItems.mock.calls[0][0])).toEqual(['track-2', 'track-3', 'track-4'])
	})

	it('is downloaded once every track is, even while the downloader still says it is busy', async () => {
		mockDownloaded = new Set(['track-0', 'track-1'])
		mockActive = [{ trackId: 'track-1', state: 'downloading' }]

		const { result } = await setup(tracks(2))

		expect(result.current.state).toBe('downloaded')
	})

	it('is downloading while the downloader has some of its tracks', async () => {
		mockActive = [{ trackId: 'track-1', state: 'pending' }]
		const { result } = await setup(tracks(3))

		await waitFor(() => expect(result.current.state).toBe('downloading'))
	})

	it('ignores downloads of other tracks', async () => {
		mockActive = [{ trackId: 'someone-elses', state: 'downloading' }]
		const { result } = await setup(tracks(3))

		expect(result.current.state).toBe('ready')
	})

	it('measures progress by the tracks done plus how far the running ones are', async () => {
		mockDownloaded = new Set(['track-0', 'track-1'])
		mockActive = [
			{ trackId: 'track-2', state: 'downloading' },
			{ trackId: 'track-3', state: 'pending' },
		]
		mockProgressMap = new Map([['track-2', { progress: 0.5 }]])
		const { result } = await setup(tracks(4))

		// (2 done + 0.5 + 0) of 4
		await waitFor(() => expect(result.current.progress).toBeCloseTo(0.625))
	})

	it('removes the downloads of the tracks', async () => {
		const { result } = await setup(tracks(3))

		await act(async () => result.current.remove())

		expect(mockDeleteDownloads).toHaveBeenCalledWith(['track-0', 'track-1', 'track-2'])
	})

	describe('stopping it', () => {
		it("cancels the collection's running and waiting downloads, and nothing else", async () => {
			mockActive = [
				{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' },
				{ trackId: 'track-2', downloadId: 'd2', state: 'pending' },
				{ trackId: 'track-3', downloadId: 'd3', state: 'completed' },
				{ trackId: 'someone-elses', downloadId: 'd4', state: 'downloading' },
			]
			const { result } = await setup(tracks(5))

			await act(async () => result.current.cancel())

			expect(mockCancelDownload.mock.calls.map(([id]) => id).sort()).toEqual(['d1', 'd2'])
		})

		it('stops the tracks being handed over, if it is tapped while they are', async () => {
			let signal: AbortSignal | undefined
			let release!: () => void
			mockDownloadItems.mockImplementationOnce((_items, given) => {
				signal = given
				return new Promise<void>((resolve) => (release = resolve))
			})
			const { result } = await setup(tracks(5))

			await act(async () => result.current.download())
			await waitFor(() => expect(signal).toBeDefined())
			expect(signal?.aborted).toBe(false)

			await act(async () => result.current.cancel())

			expect(signal?.aborted).toBe(true)

			await act(async () => release())
		})

		it('does nothing to a hand-over that has already finished', async () => {
			let signal: AbortSignal | undefined
			mockDownloadItems.mockImplementationOnce(async (_items, given) => {
				signal = given
			})
			const { result } = await setup(tracks(3))

			await act(async () => result.current.download())
			await waitFor(() => expect(mockDownloadItems).toHaveBeenCalled())

			await act(async () => result.current.cancel())

			expect(signal?.aborted).toBe(false)
		})

		it('does not fail when a download cannot be cancelled', async () => {
			mockActive = [{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' }]
			mockCancelDownload.mockRejectedValue(new Error('already finished'))
			const { result } = await setup(tracks(3))

			await expect(act(async () => result.current.cancel())).resolves.not.toThrow()
		})

		it('is ready to be started again once stopped', async () => {
			mockActive = [{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' }]
			const { result } = await setup(tracks(3))

			await waitFor(() => expect(result.current.state).toBe('downloading'))

			mockActive = []
			await act(async () => result.current.cancel())

			await waitFor(() => expect(result.current.state).toBe('ready'))

			// and a new download goes ahead: stopping is not remembered
			await act(async () => result.current.download())
			await waitFor(() => expect(mockDownloadItems).toHaveBeenCalled())
			expect(mockDownloadItems.mock.calls[0][1]?.aborted).toBe(false)
		})
	})
})
