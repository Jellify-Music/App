import React from 'react'
import { Alert } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import useDownloadQueueStore from '../../src/stores/download-queue'
import {
	ARTIST_DOWNLOAD_CONFIRM_THRESHOLD,
	useArtistDownload,
} from '../../src/hooks/downloads/artist'

let mockTracks: BaseItemDto[] = []
let mockDownloaded = new Set<string>()
let mockActive: { trackId: string; state: string; downloadId?: string }[] = []
const mockCancelDownload = jest.fn<Promise<void>, [string]>()
let mockProgressMap = new Map<string, { progress: number }>()
let mockAlbums: BaseItemDto[] | undefined = [{ Id: 'album-1' }]
let mockFeaturedOn: BaseItemDto[] | undefined = [{ Id: 'album-2' }]
const mockDownloadItems = jest.fn<Promise<void>, [BaseItemDto[]]>()
const mockDeleteDownloads = jest.fn()

jest.mock('../../src/providers/Artist', () => ({
	useArtistContext: () => ({
		artist: { Id: 'artist-1', Name: 'CHVRCHES' },
		albums: mockAlbums,
		featuredOn: mockFeaturedOn,
	}),
}))

jest.mock('../../src/api/queries/artist/utils/download-tracks', () => ({
	fetchAlbumsTracks: async () => mockTracks,
}))

jest.mock('../../src/hooks/downloads', () => ({
	useDownloadedIds: () => mockDownloaded,
}))

jest.mock('../../src/hooks/downloads/functions', () => ({
	downloadItems: (items: BaseItemDto[]) => mockDownloadItems(items),
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

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))
jest.mock('../../src/stores/auth/utils', () => ({ getApi: () => ({}), getUser: () => ({}) }))

const tracks = (count: number): BaseItemDto[] =>
	Array.from({ length: count }, (_, i) => ({ Id: `track-${i}` }))

const idsOf = (items: BaseItemDto[]) => items.map((item) => item.Id)

// the hook keeps its tracks for an hour, which would keep Jest alive for as long
const clients: QueryClient[] = []
const unmounts: (() => void)[] = []

const newClient = () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { gcTime: 0 } },
	})
	clients.push(client)
	return client
}

async function setup() {
	const client = newClient()
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	const hook = await renderHook(() => useArtistDownload(), { wrapper })
	unmounts.push(hook.unmount)

	// the tracks arrive after the first render
	await waitFor(() => expect(hook.result.current.state).not.toBe('loading'))

	return hook
}

describe('useArtistDownload', () => {
	let alert: jest.SpyInstance

	beforeEach(() => {
		mockTracks = []
		mockDownloaded = new Set()
		mockActive = []
		mockProgressMap = new Map()
		mockCancelDownload.mockReset().mockResolvedValue(undefined)
		useDownloadQueueStore.setState({ entries: {} })
		mockAlbums = [{ Id: 'album-1' }]
		mockFeaturedOn = [{ Id: 'album-2' }]
		mockDownloadItems.mockReset().mockResolvedValue(undefined)
		mockDeleteDownloads.mockReset()
		alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
	})

	afterEach(() => {
		alert.mockRestore()
		unmounts.splice(0).forEach((unmount) => unmount())
		clients.splice(0).forEach((client) => client.clear())
	})

	it('is loading until the albums are known, then reflects what is on offer', async () => {
		mockAlbums = undefined
		mockTracks = tracks(3)

		const client = newClient()

		const { result, rerender, unmount } = await renderHook(() => useArtistDownload(), {
			wrapper: ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>{children}</QueryClientProvider>
			),
		})

		unmounts.push(unmount)

		expect(result.current.state).toBe('loading')

		mockAlbums = [{ Id: 'album-1' }]
		await rerender({})

		await waitFor(() => expect(result.current.state).toBe('ready'))
	})

	it('has nothing to offer for an artist without tracks', async () => {
		const { result } = await setup()

		expect(result.current.state).toBe('empty')
	})

	it('downloads a small artist straight away, in batches the downloader can cope with', async () => {
		mockTracks = tracks(60)
		const { result } = await setup()

		expect(result.current.state).toBe('ready')

		await act(async () => result.current.startDownload())

		expect(alert).not.toHaveBeenCalled()
		await waitFor(() => expect(mockDownloadItems).toHaveBeenCalledTimes(3))
		expect(mockDownloadItems.mock.calls.map(([batch]) => batch.length)).toEqual([25, 25, 10])
		expect(idsOf(mockDownloadItems.mock.calls.flatMap(([batch]) => batch))).toEqual(
			idsOf(mockTracks),
		)
	})

	it('asks first for a big one, and downloads only once told to', async () => {
		mockTracks = tracks(ARTIST_DOWNLOAD_CONFIRM_THRESHOLD + 1)
		const { result } = await setup()

		await act(async () => result.current.startDownload())

		expect(alert).toHaveBeenCalledTimes(1)
		expect(alert.mock.calls[0][0]).toBe('Download 101 tracks?')
		expect(alert.mock.calls[0][1]).toContain('CHVRCHES')
		expect(mockDownloadItems).not.toHaveBeenCalled()

		const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[]
		expect(buttons.map((button) => button.text)).toEqual(['Cancel', 'Download'])

		await act(async () => buttons[1].onPress!())

		await waitFor(() => expect(mockDownloadItems).toHaveBeenCalledTimes(5))
	})

	it('only downloads what is not downloaded yet, and counts only that towards asking', async () => {
		mockTracks = tracks(150)
		// 60 of the 150 are still to do: under the threshold, so no prompt
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 90)) as string[])
		const { result } = await setup()

		await act(async () => result.current.startDownload())

		expect(alert).not.toHaveBeenCalled()
		await waitFor(() => expect(mockDownloadItems).toHaveBeenCalledTimes(3))
		expect(idsOf(mockDownloadItems.mock.calls.flatMap(([batch]) => batch))).toEqual(
			idsOf(mockTracks.slice(90)),
		)
	})

	it('is downloaded once every track is, and removing a few goes ahead without asking', async () => {
		mockTracks = tracks(5)
		mockDownloaded = new Set(idsOf(mockTracks) as string[])
		const { result } = await setup()

		expect(result.current.state).toBe('downloaded')

		await act(async () => result.current.removeAll())

		expect(alert).not.toHaveBeenCalled()
		expect(mockDeleteDownloads).toHaveBeenCalledWith(idsOf(mockTracks))
	})

	it('asks before removing a lot of downloads', async () => {
		mockTracks = tracks(ARTIST_DOWNLOAD_CONFIRM_THRESHOLD + 20)
		mockDownloaded = new Set(idsOf(mockTracks) as string[])
		const { result } = await setup()

		await act(async () => result.current.removeAll())

		expect(alert).toHaveBeenCalledTimes(1)
		expect(alert.mock.calls[0][0]).toBe('Remove 120 downloads?')
		expect(mockDeleteDownloads).not.toHaveBeenCalled()

		const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[]
		await act(async () => buttons[1].onPress!())

		expect(mockDeleteDownloads).toHaveBeenCalledWith(idsOf(mockTracks))
	})

	it('is downloaded once every track is, even while the downloader still says it is busy', async () => {
		mockTracks = tracks(5)
		mockDownloaded = new Set(idsOf(mockTracks) as string[])
		mockActive = [{ trackId: 'track-4', state: 'downloading' }]
		const { result } = await setup()

		expect(result.current.state).toBe('downloaded')
	})

	it('is downloading while the downloader has tracks of the artist that are still missing', async () => {
		mockTracks = tracks(10)
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 4)) as string[])
		mockActive = [{ trackId: 'track-5', state: 'downloading' }]
		const { result } = await setup()

		await waitFor(() => expect(result.current.state).toBe('downloading'))
	})

	it('is ready, not downloading, when only stale progress remains and the downloader has nothing', async () => {
		mockTracks = tracks(10)
		// a progress entry whose "completed" event never came
		mockProgressMap = new Map([['track-9', { progress: 1 }]])
		mockActive = []
		const { result } = await setup()

		expect(result.current.state).toBe('ready')
		expect(result.current.progress).toBe(0)
	})

	it('ignores other downloads, and ones that have finished, failed or been cancelled', async () => {
		mockTracks = tracks(3)
		mockActive = [
			{ trackId: 'someone-elses', state: 'downloading' },
			{ trackId: 'track-0', state: 'failed' },
			{ trackId: 'track-1', state: 'cancelled' },
		]
		const { result } = await setup()

		expect(result.current.state).toBe('ready')
	})

	it('measures progress by the tracks done plus how far the running ones are', async () => {
		mockTracks = tracks(10)
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 4)) as string[])
		mockActive = [
			{ trackId: 'track-4', state: 'downloading' },
			{ trackId: 'track-5', state: 'pending' },
		]
		mockProgressMap = new Map([['track-4', { progress: 0.5 }]])
		const { result } = await setup()

		// 4 done, one half way, one queued: (4 + 0.5 + 0) / 10
		await waitFor(() => expect(result.current.progress).toBeCloseTo(0.45))
	})

	describe('stopping it', () => {
		it("cancels this artist's running and waiting downloads, and nothing else", async () => {
			mockTracks = tracks(10)
			mockActive = [
				{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' },
				{ trackId: 'track-2', downloadId: 'd2', state: 'pending' },
				{ trackId: 'track-3', downloadId: 'd3', state: 'paused' },
				{ trackId: 'track-4', downloadId: 'd4', state: 'completed' },
				{ trackId: 'someone-elses', downloadId: 'd5', state: 'downloading' },
			]
			const { result } = await setup()

			await act(async () => result.current.cancel())

			expect(mockCancelDownload.mock.calls.map(([id]) => id).sort()).toEqual([
				'd1',
				'd2',
				'd3',
			])
		})

		it('forgets what was queued and not finished, and keeps what is done', async () => {
			mockTracks = tracks(10)
			useDownloadQueueStore.getState().record([
				{ Id: 'track-1', AlbumId: 'a' },
				{ Id: 'track-2', AlbumId: 'a' },
				{ Id: 'someone-elses', AlbumId: 'z' },
			])
			useDownloadQueueStore.getState().markDone('track-1')
			const { result } = await setup()

			await act(async () => result.current.cancel())

			expect(Object.keys(useDownloadQueueStore.getState().entries).sort()).toEqual([
				'someone-elses',
				'track-1',
			])
		})

		it('does not fail when a download cannot be cancelled', async () => {
			mockTracks = tracks(3)
			mockActive = [{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' }]
			mockCancelDownload.mockRejectedValue(new Error('already finished'))
			const { result } = await setup()

			await expect(act(async () => result.current.cancel())).resolves.not.toThrow()
		})

		it('stops handing tracks over, and stops the batch that was being handed over', async () => {
			mockTracks = tracks(60)
			let release!: () => void
			mockDownloadItems.mockImplementationOnce(
				() => new Promise<void>((resolve) => (release = resolve)),
			)
			const { result } = await setup()

			await act(async () => result.current.startDownload())
			await waitFor(() => expect(mockDownloadItems).toHaveBeenCalledTimes(1))

			// told to stop while the first batch is still being handed over
			await act(async () => result.current.cancel())

			// the first batch gets going just as it is let through
			mockActive = [{ trackId: 'track-0', downloadId: 'd0', state: 'pending' }]
			await act(async () => release())

			await waitFor(() => expect(mockCancelDownload).toHaveBeenCalledWith('d0'))
			// the other two batches are never handed over
			expect(mockDownloadItems).toHaveBeenCalledTimes(1)
		})

		it('is ready to be started again once stopped', async () => {
			mockTracks = tracks(10)
			mockActive = [{ trackId: 'track-1', downloadId: 'd1', state: 'downloading' }]
			const { result } = await setup()

			await waitFor(() => expect(result.current.state).toBe('downloading'))

			mockActive = []
			await act(async () => result.current.cancel())

			await waitFor(() => expect(result.current.state).toBe('ready'))

			// and a new download goes ahead: stopping is not remembered
			await act(async () => result.current.startDownload())
			await waitFor(() => expect(mockDownloadItems).toHaveBeenCalled())
		})
	})
})
