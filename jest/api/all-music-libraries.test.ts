import { Api } from '@jellyfin/sdk'
import { BaseItemKind, CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import { getFilterApi, getUserViewApi } from '@jellyfin/sdk/lib/utils/api'
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { queryClient } from '../../src/api/client'
import { fetchAlbums } from '../../src/api/queries/album/utils/album'
import { fetchGenres } from '../../src/api/queries/genre/utils'
import { ALL_MUSIC_LIBRARIES, MusicLibraryQueryKey } from '../../src/api/queries/libraries/keys'
import { fetchRecentlyAdded } from '../../src/api/queries/recents/utils'
import { fetchSearchResults } from '../../src/api/queries/search/utils'
import { fetchLibraryYears } from '../../src/api/queries/years/utils'
import { getApi, getUser } from '../../src/stores/auth/utils'
import { JellifyLibrary } from '../../src/types/JellifyLibrary'
import { JellifyUser } from '../../src/types/JellifyUser'

jest.mock('@jellyfin/sdk/lib/utils/api/library-api', () => {
	const getLibraryApi = jest.fn()
	return { getLibraryApi }
})

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	// Some modules import the library API from the package index, others from its own file
	getLibraryApi: jest.requireMock('@jellyfin/sdk/lib/utils/api/library-api').getLibraryApi,
	getArtistApi: jest.fn(),
	getFilterApi: jest.fn(),
	getUserViewApi: jest.fn(),
}))

jest.mock('@jellyfin/sdk/lib/utils/api/genre-api', () => ({
	getGenreApi: jest.fn(),
}))

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(),
	getUser: jest.fn(),
	getLibrary: jest.fn(),
}))

const api = {} as Api
const user = { id: 'user' } as JellifyUser
const selectedLibrary: JellifyLibrary = { musicLibraryId: 'music-a' }

const getItems = jest.fn()
const getLatestMedia = jest.fn()
const getGenres = jest.fn()
const getQueryFiltersLegacy = jest.fn()
const getUserViews = jest.fn()

describe('MusicLibraryQueryKey', () => {
	test('uses the library ID when a library is selected', () => {
		expect(MusicLibraryQueryKey('music-a')).toBe('music-a')
	})

	test('uses a stable placeholder when no library is selected', () => {
		expect(MusicLibraryQueryKey(undefined)).toBe(ALL_MUSIC_LIBRARIES)
	})
})

describe('querying without a selected music library', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		queryClient.clear()
		;(getApi as jest.Mock).mockReturnValue(api)
		;(getUser as jest.Mock).mockReturnValue(user)
		;(getLibraryApi as jest.Mock).mockReturnValue({ getItems, getLatestMedia })
		;(getGenreApi as jest.Mock).mockReturnValue({ getGenres })
		;(getFilterApi as jest.Mock).mockReturnValue({ getQueryFiltersLegacy })
		;(getUserViewApi as jest.Mock).mockReturnValue({ getUserViews })
		getUserViews.mockResolvedValue({
			data: {
				Items: [
					{ Id: 'music-a', CollectionType: CollectionType.Music },
					{ Id: 'movies', CollectionType: CollectionType.Movies },
					{ Id: 'music-b', CollectionType: CollectionType.Music },
				],
			},
		})
	})

	afterAll(() => queryClient.clear())

	test('fetches albums from every library the user can access', async () => {
		getItems.mockResolvedValueOnce({ data: { Items: [{ Id: 'album' }] } })

		await expect(fetchAlbums(api, user, undefined, 0, undefined)).resolves.toEqual([
			{ Id: 'album' },
		])

		expect(getItems).toHaveBeenCalledWith(
			expect.objectContaining({
				parentId: undefined,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
			}),
			expect.anything(),
		)
	})

	test('still scopes albums to the selected library', async () => {
		getItems.mockResolvedValueOnce({ data: { Items: [] } })

		await fetchAlbums(api, user, selectedLibrary, 0, undefined)

		expect(getItems).toHaveBeenCalledWith(
			expect.objectContaining({ parentId: 'music-a' }),
			expect.anything(),
		)
	})

	test('searches every library, limited to music items', async () => {
		getItems.mockResolvedValueOnce({ data: { Items: [{ Id: 'track' }] } })

		await expect(fetchSearchResults(undefined, 'abba')).resolves.toEqual([{ Id: 'track' }])

		expect(getItems).toHaveBeenCalledWith(
			expect.objectContaining({
				parentId: undefined,
				searchTerm: 'abba',
				includeItemTypes: ['MusicArtist', 'Audio', 'MusicAlbum', 'Playlist'],
			}),
			expect.anything(),
		)
	})

	test('merges the genres of each music library, skipping other library types', async () => {
		getGenres.mockImplementation(({ parentId }: { parentId: string }) =>
			Promise.resolve({
				data: {
					Items:
						parentId === 'music-a'
							? [
									{ Id: 'rock', Name: 'Rock' },
									{ Id: 'jazz', Name: 'Jazz' },
								]
							: [
									{ Id: 'ambient', Name: 'Ambient' },
									{ Id: 'rock', Name: 'Rock' },
								],
				},
			}),
		)

		const genres = await fetchGenres(api, user, undefined, 0)

		expect(getGenres.mock.calls.map(([params]) => params.parentId)).toEqual([
			'music-a',
			'music-b',
		])
		expect(genres.map(({ Id }) => Id)).toEqual(['ambient', 'jazz', 'rock'])
	})

	test('fetches the genres of the selected library alone', async () => {
		getGenres.mockResolvedValueOnce({ data: { Items: [{ Id: 'rock', Name: 'Rock' }] } })

		await expect(fetchGenres(api, user, selectedLibrary, 0)).resolves.toEqual([
			{ Id: 'rock', Name: 'Rock' },
		])

		expect(getUserViews).not.toHaveBeenCalled()
		expect(getGenres).toHaveBeenCalledTimes(1)
		expect(getGenres).toHaveBeenCalledWith(
			expect.objectContaining({ parentId: 'music-a' }),
			expect.anything(),
		)
	})

	test('keeps the newest albums added across music libraries', async () => {
		getLatestMedia.mockImplementation(({ parentId }: { parentId: string }) =>
			Promise.resolve({
				data:
					parentId === 'music-a'
						? [
								{ Id: 'a-new', DateCreated: '2026-11-03T00:00:00Z' },
								{ Id: 'a-old', DateCreated: '2026-01-01T00:00:00Z' },
							]
						: [{ Id: 'b-newest', DateCreated: '2026-11-05T00:00:00Z' }],
			}),
		)

		const albums = await fetchRecentlyAdded(api, undefined, 0)

		expect(getLatestMedia.mock.calls.map(([params]) => params.parentId)).toEqual([
			'music-a',
			'music-b',
		])
		expect(albums.map(({ Id }) => Id)).toEqual(['b-newest', 'a-new', 'a-old'])
	})

	test('merges the album years of each music library', async () => {
		getQueryFiltersLegacy.mockImplementation(({ parentId }: { parentId: string }) =>
			Promise.resolve({
				data: { Years: parentId === 'music-a' ? [2024, 1999] : [2004, 2024] },
			}),
		)

		await expect(fetchLibraryYears(api, undefined, user.id)).resolves.toEqual([
			1999, 2004, 2024,
		])
	})
})
