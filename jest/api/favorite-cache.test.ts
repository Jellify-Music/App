import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { queryClient } from '../../src/api/client'
import { getIsFavoriteFromCache } from '../../src/api/queries/user-data/cache'
import UserDataQueryKey from '../../src/api/queries/user-data/keys'
import { getUser } from '../../src/stores/auth/utils'
import { JellifyUser } from '../../src/types/JellifyUser'

const user = { id: 'user' } as JellifyUser

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(),
	getUser: jest.fn(),
}))

describe('getIsFavoriteFromCache', () => {
	beforeEach(() => {
		queryClient.clear()
		;(getUser as jest.Mock).mockReturnValue(user)
	})

	afterAll(() => queryClient.clear())

	const item = (isFavorite?: boolean): BaseItemDto => ({
		Id: 'track',
		UserData: isFavorite === undefined ? undefined : { Key: 'k', IsFavorite: isFavorite },
	})

	test('falls back to the item user data when nothing is cached', () => {
		expect(getIsFavoriteFromCache(item(true))).toBe(true)
		expect(getIsFavoriteFromCache(item(false))).toBe(false)
	})

	test('prefers a cached entry: a favorite added in the app after the snapshot', () => {
		queryClient.setQueryData(UserDataQueryKey(user, 'track'), { Key: 'k', IsFavorite: true })

		expect(getIsFavoriteFromCache(item(false))).toBe(true)
	})

	test('prefers a cached entry: a favorite removed in the app after the snapshot', () => {
		queryClient.setQueryData(UserDataQueryKey(user, 'track'), { Key: 'k', IsFavorite: false })

		expect(getIsFavoriteFromCache(item(true))).toBe(false)
	})

	test('a cached entry without IsFavorite counts as not favorited, not as a fallback', () => {
		queryClient.setQueryData(UserDataQueryKey(user, 'track'), { Key: 'k' })

		expect(getIsFavoriteFromCache(item(true))).toBe(false)
	})

	test('is false when there is no cache entry and no user data', () => {
		expect(getIsFavoriteFromCache(item())).toBe(false)
	})

	test('is false without an item, an item id or a signed in user', () => {
		expect(getIsFavoriteFromCache(undefined)).toBe(false)
		expect(getIsFavoriteFromCache({ UserData: { Key: 'k', IsFavorite: true } })).toBe(false)
		;(getUser as jest.Mock).mockReturnValue(undefined)
		expect(getIsFavoriteFromCache(item(true))).toBe(false)
	})

	test('does not create cache entries as a side effect', () => {
		getIsFavoriteFromCache(item(true))

		expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
	})
})
