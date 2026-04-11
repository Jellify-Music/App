/* eslint-disable @typescript-eslint/no-explicit-any */
import 'react-native'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DownloadManager } from 'react-native-nitro-player'
import React from 'react'

jest.mock('../../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false },
		},
	})

const createWrapper = (queryClient: QueryClient) => {
	function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client: queryClient }, children)
	}
	return Wrapper
}

describe('useIsDownloaded', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		jest.clearAllMocks()
		queryClient = createTestQueryClient()
	})

	afterEach(() => {
		queryClient.clear()
	})

	it('returns false when trackId is null', () => {
		const { useIsDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useIsDownloaded(null), {
			wrapper: createWrapper(queryClient),
		})

		expect(result.current).toBe(false)
	})

	it('returns false when trackId is undefined', () => {
		const { useIsDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useIsDownloaded(undefined), {
			wrapper: createWrapper(queryClient),
		})

		expect(result.current).toBe(false)
	})

	it('returns true when track is downloaded', async () => {
		const downloadedTracks = [{ trackId: 'dl-1', originalTrack: { id: 'track-1' } }]

		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue(downloadedTracks)

		const { useIsDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useIsDownloaded('track-1'), {
			wrapper: createWrapper(queryClient),
		})

		await waitFor(() => {
			expect(result.current).toBe(true)
		})
	})

	it('returns false when track is not downloaded', async () => {
		const downloadedTracks = [{ trackId: 'dl-1', originalTrack: { id: 'track-1' } }]

		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue(downloadedTracks)

		const { useIsDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useIsDownloaded('track-999'), {
			wrapper: createWrapper(queryClient),
		})

		await waitFor(() => {
			expect(result.current).toBe(false)
		})
	})

	it('returns false when no tracks are downloaded', () => {
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])

		const { useIsDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useIsDownloaded('track-1'), {
			wrapper: createWrapper(queryClient),
		})

		expect(result.current).toBe(false)
	})
})

describe('useAreAllDownloaded', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		jest.clearAllMocks()
		queryClient = createTestQueryClient()
	})

	afterEach(() => {
		queryClient.clear()
	})

	it('returns true for empty array (vacuously true)', () => {
		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue([])

		const { useAreAllDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useAreAllDownloaded([]), {
			wrapper: createWrapper(queryClient),
		})

		expect(result.current).toBe(true)
	})

	it('returns true when all tracks are downloaded', async () => {
		const downloadedTracks = [
			{ trackId: 'dl-1', originalTrack: { id: 'track-1' } },
			{ trackId: 'dl-2', originalTrack: { id: 'track-2' } },
		]

		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue(downloadedTracks)

		const { useAreAllDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useAreAllDownloaded(['track-1', 'track-2']), {
			wrapper: createWrapper(queryClient),
		})

		await waitFor(() => {
			expect(result.current).toBe(true)
		})
	})

	it('returns false when only some tracks are downloaded', async () => {
		const downloadedTracks = [{ trackId: 'dl-1', originalTrack: { id: 'track-1' } }]

		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue(downloadedTracks)

		const { useAreAllDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useAreAllDownloaded(['track-1', 'track-2']), {
			wrapper: createWrapper(queryClient),
		})

		await waitFor(() => {
			expect(result.current).toBe(false)
		})
	})

	it('returns false when array contains null or undefined IDs', async () => {
		const downloadedTracks = [{ trackId: 'dl-1', originalTrack: { id: 'track-1' } }]

		;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValue(downloadedTracks)

		const { useAreAllDownloaded } = require('../../../src/hooks/downloads')

		const { result } = renderHook(() => useAreAllDownloaded([null, 'track-1']), {
			wrapper: createWrapper(queryClient),
		})

		// null ID treated as not downloaded
		await waitFor(() => {
			expect(result.current).toBe(false)
		})
	})
})

describe('useDeleteDownloads', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		jest.clearAllMocks()
		queryClient = createTestQueryClient()
	})

	afterEach(() => {
		queryClient.clear()
	})

	it('calls DownloadManager.deleteDownloadedTrack for each ID', async () => {
		;(DownloadManager.deleteDownloadedTrack as jest.Mock).mockResolvedValue(undefined)

		const { useDeleteDownloads } = require('../../../src/hooks/downloads/mutations')

		const { result } = renderHook(() => useDeleteDownloads(), {
			wrapper: createWrapper(queryClient),
		})

		await result.current.mutateAsync(['track-1', 'track-2', 'track-3'])

		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledTimes(3)
		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledWith('track-1')
		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledWith('track-2')
		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledWith('track-3')
	})

	it('calls deleteDownloadedTrack once for a single ID', async () => {
		;(DownloadManager.deleteDownloadedTrack as jest.Mock).mockResolvedValue(undefined)

		const { useDeleteDownloads } = require('../../../src/hooks/downloads/mutations')

		const { result } = renderHook(() => useDeleteDownloads(), {
			wrapper: createWrapper(queryClient),
		})

		await result.current.mutateAsync(['track-42'])

		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledTimes(1)
		expect(DownloadManager.deleteDownloadedTrack).toHaveBeenCalledWith('track-42')
	})

	it('updates query cache on success by filtering out deleted tracks', async () => {
		// The mutation's onSuccess updates the app's singleton queryClient,
		// not the wrapper's, so we seed and assert against the app's instance.
		const { queryClient: appQueryClient } = require('../../../src/constants/query-client')

		const initialDownloads = [
			{ trackId: 'track-1', originalTrack: { id: 'track-1' } },
			{ trackId: 'track-2', originalTrack: { id: 'track-2' } },
			{ trackId: 'track-3', originalTrack: { id: 'track-3' } },
		]

		appQueryClient.setQueryData(['ALL_DOWNLOADS'], initialDownloads)
		;(DownloadManager.deleteDownloadedTrack as jest.Mock).mockResolvedValue(undefined)

		const { useDeleteDownloads } = require('../../../src/hooks/downloads/mutations')

		const { result } = renderHook(() => useDeleteDownloads(), {
			wrapper: createWrapper(queryClient),
		})

		await result.current.mutateAsync(['track-1', 'track-3'])

		await waitFor(() => {
			const cached = appQueryClient.getQueryData(['ALL_DOWNLOADS']) as any[]
			expect(cached).toHaveLength(1)
			expect(cached[0].trackId).toBe('track-2')
		})
	})

	it('handles partial failure in batch delete', async () => {
		const { queryClient: appQueryClient } = require('../../../src/constants/query-client')

		const initialDownloads = [
			{ trackId: 'track-a', originalTrack: { id: 'track-a' } },
			{ trackId: 'track-b', originalTrack: { id: 'track-b' } },
		]

		appQueryClient.setQueryData(['ALL_DOWNLOADS'], initialDownloads)

		// First call succeeds, second rejects
		;(DownloadManager.deleteDownloadedTrack as jest.Mock)
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error('Disk error'))

		const { useDeleteDownloads } = require('../../../src/hooks/downloads/mutations')

		const { result } = renderHook(() => useDeleteDownloads(), {
			wrapper: createWrapper(queryClient),
		})

		await expect(result.current.mutateAsync(['track-a', 'track-b'])).rejects.toThrow(
			'Disk error',
		)

		// onSuccess should NOT have run, so cache should be unchanged
		const cached = appQueryClient.getQueryData(['ALL_DOWNLOADS']) as any[]
		expect(cached).toHaveLength(2)
	})
})
