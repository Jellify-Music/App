import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { PlaylistsQueryKey } from '../../src/api/queries/playlist/keys'
import { useArtistPlaylists } from '../../src/hooks/use-artist-playlists'
import usePlaylistArtistsStore, { PlaylistArtistSummary } from '../../src/stores/playlist-artists'
import { playlistVersion } from '../../src/utils/artist-playlists'

let mockUserPlaylists: BaseItemDto[] = []
let mockPublicPlaylists: BaseItemDto[] = []
let mockPublicFails = false
const mockIndexFetch = jest.fn<Promise<{ artistIds: string[] }>, [BaseItemDto, AbortSignal?]>()

// Only the network layer and the on-device storage are replaced, so the real hook, stores and
// query definitions are what get tested
jest.mock('../../src/api/queries/playlist/utils', () => ({
	fetchUserPlaylists: async () => mockUserPlaylists,
	fetchPublicPlaylists: async () => {
		if (mockPublicFails) throw new Error('server said no')

		return mockPublicPlaylists
	},
	fetchPlaylistTracks: async () => [],
	fetchPlaylistArtists: (playlist: BaseItemDto, signal?: AbortSignal) =>
		mockIndexFetch(playlist, signal),
}))

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
}))

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const userListKey = [...PlaylistsQueryKey, 'user']

const summary = (playlist: Pick<BaseItemDto, 'Etag' | 'ChildCount'>, ...artistIds: string[]) =>
	({ version: playlistVersion(playlist)!, artistIds }) satisfies PlaylistArtistSummary

const index = (...artistIds: string[]) => ({ artistIds })

const artist: BaseItemDto = { Id: 'artist-1', Name: 'CHVRCHES' }

const newClient = () =>
	new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })

async function setup(client = newClient()) {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)

	return { client, ...(await renderHook(() => useArtistPlaylists(artist), { wrapper })) }
}

const savedSummaries = () => usePlaylistArtistsStore.getState().summaries

// The shared indexer stops a moment after the last page using it is gone
afterEach(async () => {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 10))
	})
})

beforeEach(() => {
	mockUserPlaylists = []
	mockPublicPlaylists = []
	mockPublicFails = false
	mockIndexFetch.mockReset()
	usePlaylistArtistsStore.setState({ summaries: {} })
})

describe('useArtistPlaylists', () => {
	it('returns only the playlists the artist is on, from both user and public lists', async () => {
		mockUserPlaylists = [
			{ Id: 'mine-yes', Name: 'Mine yes', Etag: 'a', ChildCount: 1 },
			{ Id: 'mine-no', Name: 'Mine no', Etag: 'b', ChildCount: 1 },
		]
		mockPublicPlaylists = [{ Id: 'public-yes', Name: 'Public yes', Etag: 'c', ChildCount: 1 }]

		mockIndexFetch.mockImplementation(async (playlist) =>
			index(...(playlist.Id === 'mine-no' ? ['other'] : ['artist-1'])),
		)

		const { result } = await setup()

		await waitFor(() => expect(result.current.isPending).toBe(false))

		expect(result.current.playlists.map((playlist) => playlist.Id).sort()).toEqual([
			'mine-yes',
			'public-yes',
		])
		expect(result.current.failedPlaylists).toBe(0)
	})

	it('knows which of the playlists belong to the user', async () => {
		mockUserPlaylists = [{ Id: 'mine', Etag: 'a', ChildCount: 1 }]
		mockPublicPlaylists = [{ Id: 'public', Etag: 'b', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(2))

		expect(result.current.userPlaylistIds.has('mine')).toBe(true)
		expect(result.current.userPlaylistIds.has('public')).toBe(false)
	})

	it('lists a playlist once when it is both a user and a public playlist', async () => {
		mockUserPlaylists = [{ Id: 'both', Etag: 'a', ChildCount: 1 }]
		mockPublicPlaylists = [{ Id: 'both', Etag: 'a', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		expect(result.current.playlists[0].Id).toBe('both')
		expect(mockIndexFetch).toHaveBeenCalledTimes(1)
	})

	it('still checks playlists reporting no tracks, as a library .m3u does until it is refreshed', async () => {
		mockPublicPlaylists = [{ Id: 'm3u', Name: 'Unrefreshed', Etag: 'shared', ChildCount: 0 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		expect(mockIndexFetch).toHaveBeenCalledTimes(1)
	})

	it('picks up a public playlist once Jellyfin has refreshed it, even though its count was 0', async () => {
		const refreshed = { Id: 'm3u', Etag: 'refreshed', ChildCount: 2 }
		mockPublicPlaylists = [refreshed]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		// summary made while the playlist was still unrefreshed (no tracks, shared Etag)
		usePlaylistArtistsStore.setState({
			summaries: { m3u: summary({ Etag: 'shared', ChildCount: 0 }) },
		})

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))
	})

	it('sorts the playlists by name', async () => {
		mockUserPlaylists = [{ Id: 'z', Name: 'Zebra', Etag: 'a', ChildCount: 1 }]
		mockPublicPlaylists = [
			{ Id: 'b', Name: 'banana', Etag: 'b', ChildCount: 1 },
			{ Id: 'a', Name: 'Apple', Etag: 'c', ChildCount: 1 },
		]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(3))

		expect(result.current.playlists.map((playlist) => playlist.Name)).toEqual([
			'Apple',
			'banana',
			'Zebra',
		])
	})

	it('reuses a saved summary while the playlist is unchanged', async () => {
		const playlist = { Id: 'p', Etag: 'same', ChildCount: 1 }
		mockUserPlaylists = [playlist]
		usePlaylistArtistsStore.setState({ summaries: { p: summary(playlist, 'artist-1') } })

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		expect(mockIndexFetch).not.toHaveBeenCalled()
	})

	it('rebuilds the summary of a playlist that was edited since it was last summarised', async () => {
		mockUserPlaylists = [{ Id: 'p', Etag: 'new', ChildCount: 1 }]
		// the artist was removed from the playlist after the saved summary was made
		mockIndexFetch.mockResolvedValue(index('someone-else'))
		usePlaylistArtistsStore.setState({
			summaries: { p: summary({ Etag: 'old', ChildCount: 1 }, 'artist-1') },
		})

		const { result } = await setup()

		await waitFor(() => expect(mockIndexFetch).toHaveBeenCalledTimes(1))
		await waitFor(() => expect(result.current.isPending).toBe(false))

		expect(result.current.playlists).toHaveLength(0)
	})

	it('notices a playlist being edited while the artist page is already open', async () => {
		// regression: staleness was only checked when the hook mounted, so an edit that arrived
		// with a refreshed playlist list was not picked up until the next visit
		mockUserPlaylists = [{ Id: 'p', Etag: 'v1', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValueOnce(index('artist-1'))

		const { result, client } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		// the artist is taken off the playlist, and the playlist list is refreshed
		mockUserPlaylists = [{ Id: 'p', Etag: 'v2', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValueOnce(index('someone-else'))
		await act(async () => {
			await client.refetchQueries({ queryKey: userListKey })
		})

		await waitFor(() => expect(result.current.playlists).toHaveLength(0))
		expect(mockIndexFetch).toHaveBeenCalledTimes(2)
	})

	it('summarises each unchanged playlist only once across refreshes of the list', async () => {
		mockUserPlaylists = [{ Id: 'p', Etag: 'v1', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result, client } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		await act(async () => {
			await client.refetchQueries({ queryKey: userListKey })
			await client.refetchQueries({ queryKey: userListKey })
		})

		expect(mockIndexFetch).toHaveBeenCalledTimes(1)
	})

	it('only summarises the playlists that are not already summarised', async () => {
		const known = { Id: 'known', Etag: 'k', ChildCount: 1 }
		mockUserPlaylists = [known, { Id: 'new', Etag: 'n', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))
		usePlaylistArtistsStore.setState({ summaries: { known: summary(known, 'artist-1') } })

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(2))

		expect(mockIndexFetch).toHaveBeenCalledTimes(1)
		expect(mockIndexFetch.mock.calls[0][0].Id).toBe('new')
	})

	it('shows what it has found while the rest is still being looked at', async () => {
		mockUserPlaylists = [
			{ Id: 'quick', Name: 'A quick one', Etag: 'a', ChildCount: 1 },
			{ Id: 'slow', Name: 'B slow one', Etag: 'b', ChildCount: 1 },
		]

		let finishSlow: (value: { artistIds: string[] }) => void = () => {}
		mockIndexFetch.mockImplementation((playlist) =>
			playlist.Id === 'quick'
				? Promise.resolve(index('artist-1'))
				: new Promise<{ artistIds: string[] }>((resolve) => (finishSlow = resolve)),
		)

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))
		expect(result.current.isPending).toBe(true)

		finishSlow(index('artist-1'))

		await waitFor(() => expect(result.current.isPending).toBe(false))
		expect(result.current.playlists).toHaveLength(2)
	})

	it('counts playlists that could not be checked, rather than hiding them', async () => {
		mockUserPlaylists = [
			{ Id: 'ok', Etag: 'a', ChildCount: 1 },
			{ Id: 'broken', Etag: 'b', ChildCount: 1 },
		]
		mockIndexFetch.mockImplementation(async (playlist) => {
			if (playlist.Id === 'broken') throw new Error('network')

			return index('artist-1')
		})

		const { result } = await setup()

		await waitFor(() => expect(result.current.isPending).toBe(false))

		expect(result.current.failedPlaylists).toBe(1)
		expect(result.current.playlists.map((playlist) => playlist.Id)).toEqual(['ok'])
	})

	it('looks again at the playlists that failed when asked to retry', async () => {
		mockUserPlaylists = [{ Id: 'flaky', Etag: 'f', ChildCount: 1 }]
		mockIndexFetch.mockRejectedValueOnce(new Error('network'))
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.failedPlaylists).toBe(1))
		expect(result.current.playlists).toHaveLength(0)

		await act(async () => result.current.retry())

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))
		expect(result.current.failedPlaylists).toBe(0)
	})

	it('refetches the playlist lists on request', async () => {
		mockUserPlaylists = [{ Id: 'p', Etag: 'v1', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		const { result } = await setup()

		await waitFor(() => expect(result.current.playlists).toHaveLength(1))

		// a playlist was added elsewhere since the lists were loaded
		mockUserPlaylists = [
			{ Id: 'p', Etag: 'v1', ChildCount: 1 },
			{ Id: 'added', Etag: 'a1', ChildCount: 1 },
		]

		await act(async () => {
			await result.current.refresh()
		})

		await waitFor(() => expect(result.current.playlists).toHaveLength(2))
	})

	it('reports how far along the looking is', async () => {
		mockUserPlaylists = [
			{ Id: 'a', Name: 'A', Etag: 'a1', ChildCount: 1 },
			{ Id: 'b', Name: 'B', Etag: 'b1', ChildCount: 1 },
		]

		let finishSlow: (value: { artistIds: string[] }) => void = () => {}
		mockIndexFetch.mockImplementation((playlist) =>
			playlist.Id === 'a'
				? Promise.resolve(index('artist-1'))
				: new Promise<{ artistIds: string[] }>((resolve) => (finishSlow = resolve)),
		)

		const { result } = await setup()

		await waitFor(() => expect(result.current.checked).toBe(1))
		expect(result.current.total).toBe(2)

		finishSlow(index('artist-1'))

		await waitFor(() => expect(result.current.checked).toBe(2))
		expect(result.current.isPending).toBe(false)
	})

	it('reads each playlist once however many artist pages are open', async () => {
		mockUserPlaylists = [
			{ Id: 'a', Etag: 'a1', ChildCount: 1 },
			{ Id: 'b', Etag: 'b1', ChildCount: 1 },
		]
		mockIndexFetch.mockImplementation(async (playlist) =>
			index(playlist.Id === 'a' ? 'artist-1' : 'artist-2'),
		)

		const client = newClient()
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		const first = await renderHook(() => useArtistPlaylists({ Id: 'artist-1' }), { wrapper })
		const second = await renderHook(() => useArtistPlaylists({ Id: 'artist-2' }), { wrapper })

		await waitFor(() => expect(first.result.current.isPending).toBe(false))
		await waitFor(() => expect(second.result.current.isPending).toBe(false))

		expect(mockIndexFetch).toHaveBeenCalledTimes(2)
		expect(first.result.current.playlists.map(({ Id }) => Id)).toEqual(['a'])
		expect(second.result.current.playlists.map(({ Id }) => Id)).toEqual(['b'])

		// one page being left doesn't stop the other
		await first.unmount()
		await second.unmount()
	})

	it('still works through the playlists it has when one of the lists fails to load', async () => {
		mockUserPlaylists = [{ Id: 'mine', Etag: 'a', ChildCount: 1 }]
		mockIndexFetch.mockResolvedValue(index('artist-1'))

		mockPublicFails = true

		const { result } = await setup()

		await waitFor(() => expect(result.current.failedLists).toBe(1))
		await waitFor(() => expect(result.current.playlists).toHaveLength(1))
		expect(result.current.failedPlaylists).toBe(0)
	})

	describe('what is remembered between visits', () => {
		it('saves the summaries it builds', async () => {
			const playlist = { Id: 'p', Etag: 'v1', ChildCount: 1 }
			mockUserPlaylists = [playlist]
			mockIndexFetch.mockResolvedValue(index('artist-1', 'artist-2'))

			const { result } = await setup()

			await waitFor(() => expect(result.current.isPending).toBe(false))

			expect(savedSummaries().p).toEqual(summary(playlist, 'artist-1', 'artist-2'))
		})

		it('does not need to look at the playlists again on the next visit', async () => {
			mockUserPlaylists = [
				{ Id: 'a', Etag: 'a1', ChildCount: 1 },
				{ Id: 'b', Etag: 'b1', ChildCount: 1 },
			]
			mockIndexFetch.mockResolvedValue(index('artist-1'))

			const first = await setup()

			await waitFor(() => expect(first.result.current.isPending).toBe(false))
			await first.unmount()

			mockIndexFetch.mockClear()

			const second = await setup()

			await waitFor(() => expect(second.result.current.playlists).toHaveLength(2))

			expect(mockIndexFetch).not.toHaveBeenCalled()
		})

		it('keeps the work done so far when the page is left early', async () => {
			mockUserPlaylists = [
				{ Id: 'a', Name: 'A', Etag: 'a1', ChildCount: 1 },
				{ Id: 'b', Name: 'B', Etag: 'b1', ChildCount: 1 },
			]
			mockIndexFetch.mockImplementation((playlist) =>
				playlist.Id === 'a' ? Promise.resolve(index('artist-1')) : new Promise(() => {}),
			)

			const { result, unmount } = await setup()

			await waitFor(() => expect(result.current.playlists).toHaveLength(1))

			await unmount()

			expect(Object.keys(savedSummaries())).toEqual(['a'])
		})

		it('cancels the requests in flight when the page is left, saving nothing for them', async () => {
			mockUserPlaylists = [{ Id: 'late', Etag: 'l1', ChildCount: 1 }]

			let signal: AbortSignal | undefined
			let finish: (value: { artistIds: string[] }) => void = () => {}
			mockIndexFetch.mockImplementation((_, requestSignal) => {
				signal = requestSignal

				return new Promise<{ artistIds: string[] }>((resolve) => (finish = resolve))
			})

			const { unmount } = await setup()

			await waitFor(() => expect(mockIndexFetch).toHaveBeenCalled())
			expect(signal?.aborted).toBe(false)

			await unmount()
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10))
			})

			expect(signal?.aborted).toBe(true)

			await act(async () => finish(index('artist-1')))

			expect(savedSummaries()).toEqual({})
		})

		it('forgets playlists that no longer exist once every playlist has been looked at', async () => {
			const playlist = { Id: 'still-here', Etag: 'v1', ChildCount: 1 }
			mockUserPlaylists = [playlist]
			mockIndexFetch.mockResolvedValue(index('artist-1'))
			usePlaylistArtistsStore.setState({
				summaries: { deleted: summary({ Etag: 'x', ChildCount: 1 }, 'artist-1') },
			})

			const { result } = await setup()

			await waitFor(() => expect(result.current.isPending).toBe(false))

			expect(Object.keys(savedSummaries())).toEqual(['still-here'])
		})

		it('does not forget anything when some playlists could not be looked at', async () => {
			mockUserPlaylists = [{ Id: 'broken', Etag: 'b', ChildCount: 1 }]
			mockIndexFetch.mockRejectedValue(new Error('network'))
			usePlaylistArtistsStore.setState({
				summaries: { other: summary({ Etag: 'x', ChildCount: 1 }, 'artist-1') },
			})

			const { result } = await setup()

			await waitFor(() => expect(result.current.failedPlaylists).toBe(1))

			expect(Object.keys(savedSummaries())).toEqual(['other'])
		})
	})
})
