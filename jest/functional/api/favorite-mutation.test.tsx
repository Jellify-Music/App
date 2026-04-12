import 'react-native'
import { renderHook, waitFor } from '@testing-library/react-native'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useAddFavorite, useRemoveFavorite } from '../../../src/api/mutations/favorite'

const mockMarkFavoriteItem = jest.fn()
const mockUnmarkFavoriteItem = jest.fn()

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getUserLibraryApi: jest.fn(() => ({
		markFavoriteItem: mockMarkFavoriteItem,
		unmarkFavoriteItem: mockUnmarkFavoriteItem,
	})),
}))

jest.mock('../../../src/stores', () => ({
	getApi: jest.fn(() => ({ basePath: 'https://example.com' })),
	getUser: jest.fn(() => ({ id: 'user-1', name: 'test', accessToken: 'token' })),
	getLibrary: jest.fn(() => ({ musicLibraryId: 'lib-1' })),
}))

jest.mock('../../../src/constants/query-client', () => {
	const { QueryClient } = jest.requireActual('@tanstack/react-query')
	return {
		queryClient: new QueryClient({
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		}),
	}
})

jest.mock('../../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

jest.mock('react-native-toast-message', () => ({
	__esModule: true,
	default: { show: jest.fn() },
}))

jest.mock('../../../src/api/queries/user-data/keys', () => ({
	__esModule: true,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default: jest.fn((user: any, itemId: string) => ['user-data', user.id, itemId]),
}))

jest.mock('../../../src/api/queries/track/keys', () => ({
	TrackQueryKeys: { AllTracks: 'AllTracks' },
}))

jest.mock('../../../src/enums/query-keys', () => ({
	QueryKeys: { InfiniteAlbums: 'InfiniteAlbums', InfiniteArtists: 'InfiniteArtists' },
}))

jest.mock('../../../src/stores/library', () => ({
	__esModule: true,
	default: {
		getState: jest.fn(() => ({
			filters: {
				tracks: { isFavorites: undefined },
				albums: { isFavorites: undefined },
				artists: { isFavorites: undefined },
			},
		})),
	},
}))

let testQueryClient: QueryClient

function createWrapper() {
	testQueryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false, gcTime: 0 },
		},
	})

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
	}
}

afterEach(() => {
	testQueryClient?.clear()
})

describe('useAddFavorite', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('calls markFavoriteItem with correct itemId', async () => {
		mockMarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-1', Type: BaseItemKind.Audio },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(mockMarkFavoriteItem).toHaveBeenCalledWith({ itemId: 'item-1' })
	})

	it('triggers success haptic on success', async () => {
		const { triggerHaptic } = require('../../../src/hooks/use-haptic-feedback')
		mockMarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-2', Type: BaseItemKind.Audio },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(triggerHaptic).toHaveBeenCalledWith('notificationSuccess')
	})

	it('calls onToggle callback on success', async () => {
		mockMarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })
		const onToggle = jest.fn()

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-3', Type: BaseItemKind.Audio },
			onToggle,
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(onToggle).toHaveBeenCalledWith()
	})

	it('shows toast on error', async () => {
		const Toast = require('react-native-toast-message').default
		mockMarkFavoriteItem.mockRejectedValue(new Error('Network error'))

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-4', Type: BaseItemKind.Audio },
		})

		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(Toast.show).toHaveBeenCalledWith({
			text1: 'Failed to add favorite',
			type: 'error',
		})
	})

	it('invalidates album favorites query for MusicAlbum items', async () => {
		mockMarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'album-1', Type: BaseItemKind.MusicAlbum },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(mockMarkFavoriteItem).toHaveBeenCalledWith({ itemId: 'album-1' })
	})

	it('invalidates artist favorites query for MusicArtist items', async () => {
		mockMarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'artist-1', Type: BaseItemKind.MusicArtist },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(mockMarkFavoriteItem).toHaveBeenCalledWith({ itemId: 'artist-1' })
	})

	it('handles undefined API gracefully', async () => {
		const { getApi } = require('../../../src/stores')
		;(getApi as jest.Mock).mockReturnValueOnce(undefined)

		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-no-api', Type: BaseItemKind.Audio },
		})

		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(mockMarkFavoriteItem).not.toHaveBeenCalled()
	})

	it('handles undefined item.Id gracefully', async () => {
		const { result } = renderHook(() => useAddFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: undefined, Type: BaseItemKind.Audio },
		})

		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(mockMarkFavoriteItem).not.toHaveBeenCalled()
	})
})

describe('useRemoveFavorite', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('calls unmarkFavoriteItem with correct itemId', async () => {
		mockUnmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })

		const { result } = renderHook(() => useRemoveFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-1', Type: BaseItemKind.MusicAlbum },
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(mockUnmarkFavoriteItem).toHaveBeenCalledWith({ itemId: 'item-1' })
	})

	it('shows toast on error', async () => {
		const Toast = require('react-native-toast-message').default
		mockUnmarkFavoriteItem.mockRejectedValue(new Error('Network error'))

		const { result } = renderHook(() => useRemoveFavorite(), {
			wrapper: createWrapper(),
		})

		result.current.mutate({
			item: { Id: 'item-2', Type: BaseItemKind.MusicAlbum },
		})

		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(Toast.show).toHaveBeenCalledWith({
			text1: 'Failed to remove favorite',
			type: 'error',
		})
	})
})
