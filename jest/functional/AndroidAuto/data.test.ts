import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { queryClient } from '../../../src/constants/query-client'
import { RecentlyPlayedTracksQueryKey } from '../../../src/api/queries/recents/keys'
import { fetchRecentlyPlayed } from '../../../src/api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../../../src/api/queries/frequents/utils/frequents'
import { fetchPlaylistTracks, fetchUserPlaylists } from '../../../src/api/queries/playlist/utils'
import {
	loadFrequentlyPlayed,
	loadRecentlyPlayed,
	loadUserPlaylists,
} from '../../../src/services/android-auto/data'
import { JellifyUser } from '../../../src/types/JellifyUser'
import { JellifyLibrary } from '../../../src/types/JellifyLibrary'

// Only `id`/`musicLibraryId` are read by RecentlyPlayedTracksQueryKey; cast rather than
// filling in the rest of JellifyUser's required fields with unused placeholder values.
const user = { id: 'user-1' } as JellifyUser
const library = { musicLibraryId: 'lib-1' } as JellifyLibrary

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
	getLibrary: () => ({ musicLibraryId: 'lib-1' }),
}))
jest.mock('../../../src/stores/auth', () => ({
	__esModule: true,
	default: { getState: () => ({}), subscribe: jest.fn() },
	useJellifyLibrary: jest.fn(),
	useJellifyUser: jest.fn(),
}))
jest.mock('../../../src/api/queries/recents/utils', () => ({
	fetchRecentlyPlayed: jest.fn(),
	fetchRecentlyPlayedArtists: jest.fn(),
}))
jest.mock('../../../src/api/queries/frequents/utils/frequents', () => ({
	fetchFrequentlyPlayed: jest.fn(),
	fetchFrequentlyPlayedArtists: jest.fn(),
}))
jest.mock('../../../src/api/queries/playlist/utils', () => ({
	fetchUserPlaylists: jest.fn(),
	fetchPlaylistTracks: jest.fn(),
	fetchPublicPlaylists: jest.fn(),
}))

const track: BaseItemDto = { Id: 't1', Name: 'Track', Type: 'Audio' }

beforeAll(() => {
	// captureError/captureInfo log via console.error/console.info; silence them so
	// test output stays pristine (the error-path tests deliberately trigger captureError).
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'info').mockImplementation(() => {})
})

beforeEach(() => {
	jest.clearAllMocks()
	queryClient.clear()
})

afterAll(() => {
	// The real queryClient schedules an un-unref'd gcTime timeout (24h) whenever a
	// query is fetched/set with no active observers, which is exactly what
	// ensureInfiniteQueryData/setQueryData do here. Without clearing the cache after
	// the last test, that dangling timer keeps the Jest worker process alive and the
	// run hangs ("Jest did not exit one second after the test run has completed").
	queryClient.clear()
})

describe('loadRecentlyPlayed', () => {
	it('fetches when the cache is empty (empty cache is not an empty library)', async () => {
		;(fetchRecentlyPlayed as jest.Mock).mockResolvedValue([track])

		const result = await loadRecentlyPlayed()

		expect(fetchRecentlyPlayed).toHaveBeenCalledTimes(1)
		expect(result).toEqual({ data: [track], error: false })
	})

	it('uses cached data without fetching', async () => {
		queryClient.setQueryData(RecentlyPlayedTracksQueryKey(user, library), {
			pages: [[track]],
			pageParams: [0],
		})

		const result = await loadRecentlyPlayed()

		expect(fetchRecentlyPlayed).not.toHaveBeenCalled()
		expect(result.data).toEqual([track])
	})

	it('reports an error instead of an empty list when the fetch fails', async () => {
		// "Network Error" short-circuits the query client's retry policy, keeping the test fast.
		;(fetchRecentlyPlayed as jest.Mock).mockRejectedValue(new Error('Network Error'))

		const result = await loadRecentlyPlayed()

		expect(result).toEqual({ data: [], error: true })
	})
})

describe('loadFrequentlyPlayed', () => {
	it('returns the flattened first page', async () => {
		;(fetchFrequentlyPlayed as jest.Mock).mockResolvedValue([track, { ...track, Id: 't2' }])

		expect((await loadFrequentlyPlayed()).data).toHaveLength(2)
	})
})

describe('loadUserPlaylists', () => {
	it('loads every playlist with its first page of tracks', async () => {
		const playlist: BaseItemDto = { Id: 'p1', Name: 'Road trip', Type: 'Playlist' }
		;(fetchUserPlaylists as jest.Mock).mockResolvedValue([playlist])
		;(fetchPlaylistTracks as jest.Mock).mockResolvedValue([track])

		const result = await loadUserPlaylists()

		expect(fetchPlaylistTracks).toHaveBeenCalledWith(
			expect.anything(),
			'p1',
			0,
			expect.anything(),
		)
		expect(result).toEqual({ data: [{ playlist, tracks: [track] }], error: false })
	})

	it('flags an error when the playlist list cannot be fetched', async () => {
		;(fetchUserPlaylists as jest.Mock).mockRejectedValue(new Error('Network Error'))

		expect(await loadUserPlaylists()).toEqual({ data: [], error: true })
	})
})
