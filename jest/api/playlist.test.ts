import { Api } from '@jellyfin/sdk'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api'
import { fetchPlaylistTracks } from '../../src/api/queries/playlist/utils'
import { ApiLimits } from '../../src/configs/querying/index.config'
import { ApiNotAvailableError } from '../../src/types/errors'
import { captureError } from '../../src/utils/logging'

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

const createTracks = (count: number, offset = 0): BaseItemDto[] =>
	Array.from({ length: count }, (_, i) => ({ Id: `track-${offset + i}` }))

describe('fetchPlaylistTracks', () => {
	const getPlaylistItems = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
		;(getPlaylistApi as jest.Mock).mockReturnValue({ getPlaylistItems })
	})

	test('returns tracks from a single page', async () => {
		getPlaylistItems.mockResolvedValueOnce({ data: { Items: createTracks(3) } })

		const tracks = await fetchPlaylistTracks('playlist', undefined, api)

		expect(tracks).toEqual(createTracks(3))
		expect(getPlaylistItems).toHaveBeenCalledTimes(1)
	})

	test('pages through the whole playlist and returns every track', async () => {
		getPlaylistItems
			.mockResolvedValueOnce({ data: { Items: createTracks(ApiLimits.Library) } })
			.mockResolvedValueOnce({
				data: { Items: createTracks(ApiLimits.Library, ApiLimits.Library) },
			})
			.mockResolvedValueOnce({ data: { Items: createTracks(5, ApiLimits.Library * 2) } })

		const tracks = await fetchPlaylistTracks('playlist', undefined, api)

		expect(tracks).toHaveLength(ApiLimits.Library * 2 + 5)
		expect(tracks.map(({ Id }) => Id)).toEqual(
			createTracks(ApiLimits.Library * 2 + 5).map(({ Id }) => Id),
		)
		expect(getPlaylistItems).toHaveBeenCalledTimes(3)
		getPlaylistItems.mock.calls.forEach(([params], page) => {
			expect(params).toMatchObject({
				playlistId: 'playlist',
				startIndex: page * ApiLimits.Library,
				limit: ApiLimits.Library,
			})
		})
	})

	test('requests user data with each page', async () => {
		getPlaylistItems.mockResolvedValueOnce({ data: { Items: [] } })

		await fetchPlaylistTracks('playlist', undefined, api)

		expect(getPlaylistItems).toHaveBeenCalledWith(
			expect.objectContaining({ enableUserData: true }),
			expect.anything(),
		)
	})

	test('stops after an exactly full page followed by an empty one', async () => {
		getPlaylistItems
			.mockResolvedValueOnce({ data: { Items: createTracks(ApiLimits.Library) } })
			.mockResolvedValueOnce({ data: {} })

		const tracks = await fetchPlaylistTracks('playlist', undefined, api)

		expect(tracks).toHaveLength(ApiLimits.Library)
		expect(getPlaylistItems).toHaveBeenCalledTimes(2)
	})

	test('passes the abort signal to each request', async () => {
		const { signal } = new AbortController()
		getPlaylistItems.mockResolvedValueOnce({ data: { Items: [] } })

		await fetchPlaylistTracks('playlist', signal, api)

		expect(getPlaylistItems).toHaveBeenCalledWith(expect.anything(), { signal })
	})

	test('rejects without partial results when a page fails', async () => {
		const error = new Error('Network Error')
		getPlaylistItems
			.mockResolvedValueOnce({ data: { Items: createTracks(ApiLimits.Library) } })
			.mockRejectedValueOnce(error)

		await expect(fetchPlaylistTracks('playlist', undefined, api)).rejects.toBe(error)

		expect(getPlaylistItems).toHaveBeenCalledTimes(2)
		expect(captureError).toHaveBeenCalledWith(error, 'Playlist', expect.any(String))
	})

	test('throws when the api is not available', async () => {
		await expect(fetchPlaylistTracks('playlist')).rejects.toBeInstanceOf(ApiNotAvailableError)

		expect(getPlaylistItems).not.toHaveBeenCalled()
	})
})
