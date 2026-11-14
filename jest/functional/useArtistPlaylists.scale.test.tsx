import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useArtistPlaylists } from '../../src/hooks/use-artist-playlists'
import usePlaylistArtistsStore from '../../src/stores/playlist-artists'
import { memoryStorageValues } from '../helpers/memory-storage'

let mockUserPlaylists: BaseItemDto[] = []
let mockPublicPlaylists: BaseItemDto[] = []
let mockFetches = 0

jest.mock('../../src/api/queries/playlist/utils', () => ({
	fetchUserPlaylists: async () => mockUserPlaylists,
	fetchPublicPlaylists: async () => mockPublicPlaylists,
	fetchPlaylistTracks: async () => [],
	fetchPlaylistArtists: async () => {
		mockFetches++

		// every third playlist features the artist
		return { artistIds: mockFetches % 3 === 0 ? ['artist-1'] : ['someone-else'] }
	},
}))

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
}))

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const playlists = (prefix: string, count: number): BaseItemDto[] =>
	Array.from({ length: count }, (_, index) => ({
		Id: `${prefix}${index}`,
		Name: `${prefix} ${index}`,
		Etag: `etag-${prefix}${index}`,
		ChildCount: 20,
	}))

// Libraries can hold thousands of playlists. Working through them used to take time that grew with
// the square of their number (93 seconds for 10,000, even with instant responses). What is checked
// here is how much work gets done, not how long it takes, so it doesn't depend on the machine
// running the tests: the test timeout is only there to stop a runaway.
describe('useArtistPlaylists with a very large number of playlists', () => {
	it('works through 10,000 playlists quickly, without rendering for every one of them', async () => {
		mockFetches = 0
		memoryStorageValues.clear()
		usePlaylistArtistsStore.setState({ summaries: {} })
		mockUserPlaylists = playlists('user', 8000)
		mockPublicPlaylists = playlists('public', 2000)

		const client = new QueryClient({
			defaultOptions: { queries: { retry: false, gcTime: Infinity } },
		})

		let renders = 0

		const { result } = await renderHook(
			() => {
				renders++

				return useArtistPlaylists({ Id: 'artist-1', Name: 'Artist' })
			},
			{
				wrapper: ({ children }: { children: React.ReactNode }) => (
					<QueryClientProvider client={client}>{children}</QueryClientProvider>
				),
			},
		)

		await waitFor(() => expect(result.current.isPending).toBe(false), {
			timeout: 30000,
			interval: 100,
		})

		// progress is shown a few times a second, not once for each of the playlists
		expect(renders).toBeLessThan(100)
		expect(mockFetches).toBe(10000)
		expect(result.current.playlists).toHaveLength(Math.floor(10000 / 3))
		expect(result.current.failedPlaylists).toBe(0)
		expect(result.current.checked).toBe(10000)
		expect(Object.keys(usePlaylistArtistsStore.getState().summaries)).toHaveLength(10000)

		// each summary is saved once, on its own, not the whole lot again for every batch
		expect(memoryStorageValues.size).toBe(10000)
	}, 60000)
})
