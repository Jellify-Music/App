import { Api } from '@jellyfin/sdk'
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api'
import { fetchMusicLibraries } from '../../src/api/queries/libraries/utils'
import { ApiNotAvailableError, UserNotAvailableError } from '../../src/types/errors'
import { captureError } from '../../src/utils/logging'
import { JellifyUser } from '../../src/types/JellifyUser'

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getUserViewApi: jest.fn(),
}))

jest.mock('../../src/utils/logging', () => ({
	...jest.requireActual('../../src/utils/logging'),
	captureError: jest.fn(),
}))

const api = {} as Api
const user = { id: 'user' } as JellifyUser

const getUserViews = jest.fn()

describe('fetchMusicLibraries', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(getUserViewApi as jest.Mock).mockReturnValue({ getUserViews })
	})

	test('returns only music libraries', async () => {
		getUserViews.mockResolvedValueOnce({
			data: {
				Items: [
					{ Id: 'music-a', CollectionType: CollectionType.Music },
					{ Id: 'movies', CollectionType: CollectionType.Movies },
					{ Id: 'playlists', CollectionType: CollectionType.Playlists },
				],
			},
		})

		await expect(fetchMusicLibraries(api, user)).resolves.toEqual([
			{ Id: 'music-a', CollectionType: CollectionType.Music },
		])
	})

	test('returns no libraries when the server sends none', async () => {
		getUserViews.mockResolvedValueOnce({ data: {} })

		await expect(fetchMusicLibraries(api, user)).resolves.toEqual([])
	})

	test('requires an API client and a user', async () => {
		await expect(fetchMusicLibraries(undefined, user)).rejects.toBeInstanceOf(
			ApiNotAvailableError,
		)
		await expect(fetchMusicLibraries(api, undefined)).rejects.toBeInstanceOf(
			UserNotAvailableError,
		)

		expect(getUserViews).not.toHaveBeenCalled()
	})

	test('reports a failed request', async () => {
		const error = new Error('Network Error')
		getUserViews.mockRejectedValueOnce(error)

		await expect(fetchMusicLibraries(api, user)).rejects.toBe(error)

		expect(captureError).toHaveBeenCalledWith(
			error,
			expect.anything(),
			'Failed to fetch music libraries',
		)
	})

	test("doesn't report a cancelled request", async () => {
		const controller = new AbortController()
		controller.abort()
		getUserViews.mockRejectedValueOnce(new Error('canceled'))

		await expect(fetchMusicLibraries(api, user, controller.signal)).rejects.toThrow('canceled')

		expect(captureError).not.toHaveBeenCalled()
	})
})
