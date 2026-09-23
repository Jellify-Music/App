import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { queryClient } from '../../../src/constants/query-client'
import { RecentlyPlayedTracksQueryKey } from '../../../src/api/queries/recents/keys'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../../src/api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../../../src/api/queries/frequents/utils/frequents'
import { fetchPlaylistTracks, fetchUserPlaylists } from '../../../src/api/queries/playlist/utils'
import {
	PLAYLIST_TRACK_CAP,
	PLAYLISTS_TRACK_BUDGET,
	loadFrequentlyPlayed,
	loadRecentlyAdded,
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
	fetchRecentlyAdded: jest.fn(),
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
	jest.spyOn(console, 'warn').mockImplementation(() => {})
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

	it('refetches data the car would otherwise show hours out of date', async () => {
		// The app caches for twelve hours; the car settles for five minutes.
		queryClient.setQueryData(
			RecentlyPlayedTracksQueryKey(user, library),
			{ pages: [[track]], pageParams: [0] },
			{ updatedAt: Date.now() - 6 * 60 * 1000 },
		)
		;(fetchRecentlyPlayed as jest.Mock).mockResolvedValue([track])

		await loadRecentlyPlayed()

		expect(fetchRecentlyPlayed).toHaveBeenCalledTimes(1)
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

describe('loadRecentlyAdded', () => {
	it('returns the flattened first page of recently added items', async () => {
		const album: BaseItemDto = { Id: 'al1', Name: 'New', Type: 'MusicAlbum' }
		;(fetchRecentlyAdded as jest.Mock).mockResolvedValue([album])

		expect(await loadRecentlyAdded()).toEqual({ data: [album], error: false })
		expect(fetchRecentlyAdded).toHaveBeenCalledWith({}, library, 0, expect.anything())
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

	const playlistsNamed = (count: number): BaseItemDto[] =>
		Array.from({ length: count }, (_, i) => ({ Id: `p${i}`, Name: `P${i}`, Type: 'Playlist' }))
	const tracks = (count: number): BaseItemDto[] =>
		Array.from({ length: count }, (_, i) => ({ ...track, Id: `t${i}` }))

	it('caps the tracks materialized per playlist', async () => {
		;(fetchUserPlaylists as jest.Mock).mockResolvedValue(playlistsNamed(1))
		;(fetchPlaylistTracks as jest.Mock).mockResolvedValue(tracks(PLAYLIST_TRACK_CAP + 50))

		const { data } = await loadUserPlaylists()

		expect(data[0].tracks).toHaveLength(PLAYLIST_TRACK_CAP)
	})

	it('stops fetching playlists once the track budget is used up', async () => {
		const perPlaylist = PLAYLIST_TRACK_CAP
		const withinBudget = PLAYLISTS_TRACK_BUDGET / perPlaylist
		;(fetchUserPlaylists as jest.Mock).mockResolvedValue(playlistsNamed(withinBudget + 12))
		;(fetchPlaylistTracks as jest.Mock).mockResolvedValue(tracks(perPlaylist))

		const { data, error } = await loadUserPlaylists()

		expect(error).toBe(false)
		expect(data).toHaveLength(withinBudget)
		expect(data.reduce((total, p) => total + p.tracks.length, 0)).toBe(PLAYLISTS_TRACK_BUDGET)
		expect(fetchPlaylistTracks).toHaveBeenCalledTimes(withinBudget)
		expect(console.warn).toHaveBeenCalledWith(
			expect.anything(),
			expect.stringContaining('12 playlists'),
			expect.anything(),
		)
	})

	it('skips a playlist whose tracks fail to load instead of failing the tab', async () => {
		const [good, bad] = playlistsNamed(2)
		;(fetchUserPlaylists as jest.Mock).mockResolvedValue([good, bad])
		;(fetchPlaylistTracks as jest.Mock).mockImplementation((_api, id: string) =>
			id === bad.Id ? Promise.reject(new Error('Network Error')) : Promise.resolve([track]),
		)

		expect(await loadUserPlaylists()).toEqual({
			data: [{ playlist: good, tracks: [track] }],
			error: false,
		})
	})

	it('flags an error when the playlist list cannot be fetched', async () => {
		;(fetchUserPlaylists as jest.Mock).mockRejectedValue(new Error('Network Error'))

		expect(await loadUserPlaylists()).toEqual({ data: [], error: true })
	})
})
