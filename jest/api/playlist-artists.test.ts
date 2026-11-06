import { Api } from '@jellyfin/sdk'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { fetchPlaylistArtists } from '../../src/api/queries/playlist/utils'
import { ApiLimits } from '../../src/configs/querying/index.config'
import { ApiNotAvailableError } from '../../src/types/errors'

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getLibraryApi: jest.fn(),
	getPlaylistApi: jest.fn(),
}))

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(() => undefined),
	getUser: jest.fn(() => undefined),
}))

jest.mock('../../src/utils/logging', () => ({
	captureError: jest.fn(),
	LoggingContext: { Playlist: 'Playlist' },
}))

const api = {} as Api

const tracks = (count: number, artist: string, offset = 0): BaseItemDto[] =>
	Array.from({ length: count }, (_, i) => ({
		Id: `track-${offset + i}`,
		ArtistItems: [{ Id: artist }],
	}))

describe('fetchPlaylistArtists', () => {
	const getItems = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
		;(getLibraryApi as jest.Mock).mockReturnValue({ getItems })
	})

	it('asks for the playlist’s tracks without anything it does not need', async () => {
		getItems.mockResolvedValueOnce({ data: { Items: tracks(2, 'artist-1') } })

		await fetchPlaylistArtists({ Id: 'playlist' }, undefined, api)

		expect(getItems).toHaveBeenCalledWith(
			expect.objectContaining({
				parentId: 'playlist',
				recursive: false,
				enableImages: false,
				enableUserData: false,
				enableTotalRecordCount: false,
			}),
			expect.anything(),
		)
	})

	it('returns the artists of the tracks, without repeating any', async () => {
		getItems.mockResolvedValueOnce({
			data: { Items: [...tracks(2, 'artist-1'), ...tracks(1, 'artist-2', 2)] },
		})

		const { artistIds } = await fetchPlaylistArtists({ Id: 'playlist' }, undefined, api)

		expect([...artistIds].sort()).toEqual(['artist-1', 'artist-2'])
	})

	it('reads every page of a long playlist', async () => {
		getItems
			.mockResolvedValueOnce({ data: { Items: tracks(ApiLimits.Library, 'artist-1') } })
			.mockResolvedValueOnce({
				data: { Items: tracks(3, 'artist-2', ApiLimits.Library) },
			})

		const { artistIds } = await fetchPlaylistArtists({ Id: 'playlist' }, undefined, api)

		expect(getItems).toHaveBeenCalledTimes(2)
		expect(getItems.mock.calls[1][0]).toMatchObject({
			startIndex: ApiLimits.Library,
			limit: ApiLimits.Library,
		})
		expect([...artistIds].sort()).toEqual(['artist-1', 'artist-2'])
	})

	it('passes the abort signal on, so the request can be cancelled', async () => {
		getItems.mockResolvedValueOnce({ data: { Items: [] } })
		const { signal } = new AbortController()

		await fetchPlaylistArtists({ Id: 'playlist' }, signal, api)

		expect(getItems.mock.calls[0][1]).toEqual({ signal })
	})

	it('fails when there is no API to ask', async () => {
		await expect(fetchPlaylistArtists({ Id: 'playlist' })).rejects.toBeInstanceOf(
			ApiNotAvailableError,
		)
	})
})
