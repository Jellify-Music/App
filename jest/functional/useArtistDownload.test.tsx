import React from 'react'
import { Alert } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	ARTIST_DOWNLOAD_CONFIRM_THRESHOLD,
	useArtistDownload,
} from '../../src/hooks/downloads/artist'

let mockTracks: BaseItemDto[] = []
let mockDownloaded = new Set<string>()
let mockProgress = { overallProgress: 0, isDownloading: false }
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
	useDownloadProgress: () => mockProgress,
}))

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
		mockProgress = { overallProgress: 0, isDownloading: false }
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
		mockProgress = { overallProgress: 1, isDownloading: true }
		const { result } = await setup()

		expect(result.current.state).toBe('downloaded')
	})

	it('is downloading while the downloader is busy with tracks that are still missing', async () => {
		mockTracks = tracks(10)
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 4)) as string[])
		mockProgress = { overallProgress: 0.5, isDownloading: true }
		const { result } = await setup()

		expect(result.current.state).toBe('downloading')
	})

	it('measures progress by the tracks done plus what is in flight, so it does not start over', async () => {
		mockTracks = tracks(10)
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 4)) as string[])
		mockProgress = { overallProgress: 0, isDownloading: true }
		const { result, rerender } = await setup()

		// 4 of 10 are done, and none of what is in flight has got anywhere yet
		expect(result.current.progress).toBeCloseTo(0.4)

		// the downloader's own figure covers only what is in flight, and counts for a share of the whole
		mockProgress = { overallProgress: 0.5, isDownloading: true }
		await rerender({})

		expect(result.current.progress).toBeGreaterThan(0.4)
		expect(result.current.progress).toBeLessThan(1)

		// one more lands and the downloader's figure drops back: the total still goes up
		const before = result.current.progress
		mockDownloaded = new Set(idsOf(mockTracks.slice(0, 5)) as string[])
		mockProgress = { overallProgress: 0.1, isDownloading: true }
		await rerender({})

		expect(result.current.progress).toBeGreaterThan(before - 0.05)
	})
})
