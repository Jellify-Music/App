/* eslint-disable @typescript-eslint/no-explicit-any */
import 'react-native'
import { renderHook } from '@testing-library/react-native'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'

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

const mockSetQueryData = jest.fn()
const mockEnsureQueryData = jest.fn().mockResolvedValue(undefined)
const mockGetQueryState = jest.fn()

jest.mock('../../../src/constants/query-client', () => ({
	queryClient: {
		setQueryData: (...args: any[]) => mockSetQueryData(...args),
		ensureQueryData: (...args: any[]) => mockEnsureQueryData(...args),
		getQueryState: (...args: any[]) => mockGetQueryState(...args),
	},
	ONE_DAY: 86400000,
	ONE_HOUR: 3600000,
	ONE_MINUTE: 60000,
}))

jest.mock('../../../src/stores', () => ({
	getApi: jest.fn(() => ({ basePath: 'https://example.com' })),
	getUser: jest.fn(() => ({ id: 'user-1', name: 'test', accessToken: 'token' })),
}))

jest.mock('../../../src/api/queries/user-data/keys', () => ({
	__esModule: true,
	default: jest.fn((user: any, itemId: string) => ['user-data', user.id, itemId]),
}))

jest.mock('../../../src/api/queries/user-data/utils', () => ({
	__esModule: true,
	default: jest.fn(),
}))

jest.mock('../../../src/api/queries/item', () => ({
	fetchAlbumDiscs: jest.fn(),
	fetchItem: jest.fn(),
}))

jest.mock('../../../src/api/queries/artist/keys', () => ({
	ArtistQueryKey: jest.fn((id: string) => ['artist', id]),
}))

jest.mock('../../../src/api/queries/album/queries', () => ({
	AlbumQuery: jest.fn((album: any) => ({
		queryKey: ['album-discs', album.Id],
		queryFn: jest.fn(),
	})),
}))

jest.mock('../../../src/enums/query-keys', () => ({
	QueryKeys: {
		Album: 'Album',
		ItemTracks: 'ItemTracks',
	},
}))

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getItemsApi: jest.fn(() => ({
		getItems: jest.fn().mockResolvedValue({ data: { Items: [] } }),
	})),
}))

import useItemContext from '../../../src/hooks/use-item-context'
import { getApi, getUser } from '../../../src/stores'

describe('useItemContext', () => {
	// NOTE: The module-level `prefetchedContext` Set in use-item-context.ts
	// persists across tests within the same module instance. This is safe
	// because every test uses a unique item ID, so the dedup guard never
	// collides. If you add a test that reuses an ID from another test,
	// it will be silently skipped by the Set. Always use unique IDs.
	beforeEach(() => {
		jest.clearAllMocks()
		;(getApi as jest.Mock).mockReturnValue({ basePath: 'https://example.com' })
		;(getUser as jest.Mock).mockReturnValue({
			id: 'user-1',
			name: 'test',
			accessToken: 'token',
		})
		mockGetQueryState.mockReturnValue(undefined)
	})

	it('skips duplicate prefetches for the same item via dedup guard', () => {
		const item = {
			Id: 'dedup-audio-1',
			Type: BaseItemKind.Audio,
			AlbumId: 'album-dedup',
			ArtistItems: [{ Id: 'artist-dedup', Name: 'Dedup Artist' }],
		}

		const { result: first } = renderHook(() => useItemContext())
		first.current(item)

		const firstCallCount = mockEnsureQueryData.mock.calls.length

		const { result: second } = renderHook(() => useItemContext())
		second.current(item)

		expect(mockEnsureQueryData.mock.calls.length).toBe(firstCallCount)
	})

	it('warms album and artist context for Audio items', () => {
		const item = {
			Id: 'audio-item-1',
			Type: BaseItemKind.Audio,
			AlbumId: 'album-100',
			ArtistItems: [{ Id: 'artist-200', Name: 'Test Artist' }],
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockEnsureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['album-discs', 'album-100'],
			}),
		)

		expect(mockEnsureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['artist', 'artist-200'],
			}),
		)
	})

	it('sets query data directly for MusicArtist items', () => {
		const item = {
			Id: 'artist-item-1',
			Type: BaseItemKind.MusicArtist,
			Name: 'Direct Artist',
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockSetQueryData).toHaveBeenCalledWith(['artist', 'artist-item-1'], item)
	})

	it('sets query data and ensures disc data for MusicAlbum items', () => {
		const item = {
			Id: 'album-item-1',
			Type: BaseItemKind.MusicAlbum,
			Name: 'Test Album',
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockSetQueryData).toHaveBeenCalledWith(['Album', 'album-item-1'], item)

		expect(mockEnsureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['ItemTracks', 'album-item-1'],
			}),
		)
	})

	it('ensures query data for Playlist tracks', () => {
		const item = {
			Id: 'playlist-item-1',
			Type: BaseItemKind.Playlist,
			Name: 'Test Playlist',
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockEnsureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['ItemTracks', 'playlist-item-1'],
			}),
		)
	})

	it('returns early when item has no Id', () => {
		const item = {
			Id: undefined,
			Type: BaseItemKind.Audio,
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item as any)

		expect(mockSetQueryData).not.toHaveBeenCalled()
		expect(mockEnsureQueryData).not.toHaveBeenCalled()
	})

	it('returns early when getApi returns undefined', () => {
		;(getApi as jest.Mock).mockReturnValue(undefined)

		const item = {
			Id: 'no-api-item-1',
			Type: BaseItemKind.Audio,
			AlbumId: 'album-no-api',
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockSetQueryData).not.toHaveBeenCalled()
		expect(mockEnsureQueryData).not.toHaveBeenCalled()
	})

	it('always ensures user data query for valid items', () => {
		const item = {
			Id: 'user-data-item-1',
			Type: BaseItemKind.MusicArtist,
			Name: 'Artist For UserData',
		}

		const { result } = renderHook(() => useItemContext())
		result.current(item)

		expect(mockEnsureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['user-data', 'user-1', 'user-data-item-1'],
			}),
		)
	})

	it('handles ensureQueryData rejection without crashing', async () => {
		// Create rejecting promises that we can track to prevent unhandled rejection warnings
		const rejections: Promise<unknown>[] = []
		mockEnsureQueryData.mockImplementation(() => {
			const p = Promise.reject(new Error('Network timeout'))
			rejections.push(p)
			return p
		})

		const item = {
			Id: 'reject-playlist-1',
			Type: BaseItemKind.Playlist,
			Name: 'Failing Playlist',
		}

		const { result } = renderHook(() => useItemContext())

		// warmItemContext calls ensureQueryData fire-and-forget (no await),
		// so the synchronous call itself should not throw
		expect(() => result.current(item)).not.toThrow()

		expect(mockEnsureQueryData).toHaveBeenCalled()

		// Catch the floating rejections so Jest does not report unhandled promise rejections
		await Promise.allSettled(rejections)
	})
})
