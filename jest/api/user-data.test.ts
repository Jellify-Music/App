import React from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useIsFavorite } from '../../src/api/queries/user-data'
import UserDataQueryKey from '../../src/api/queries/user-data/keys'
import fetchUserData from '../../src/api/queries/user-data/utils'
import { JellifyUser } from '../../src/types/JellifyUser'

const user = { id: 'user' } as JellifyUser

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(),
	getUser: jest.fn(() => user),
}))

jest.mock('../../src/api/queries/user-data/utils', () => ({
	__esModule: true,
	default: jest.fn(),
}))

describe('useIsFavorite', () => {
	let queryClient: QueryClient

	const wrapper = ({ children }: { children: React.ReactNode }) =>
		React.createElement(QueryClientProvider, { client: queryClient }, children)

	const renderIsFavorite = (item: BaseItemDto) =>
		renderHook(() => useIsFavorite(item), { wrapper })

	beforeEach(() => {
		jest.clearAllMocks()
		queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	})

	afterEach(() => queryClient.clear())

	test('uses the item user data without fetching', async () => {
		const { result } = await renderIsFavorite({
			Id: 'track',
			UserData: { Key: 'value', IsFavorite: true },
		})

		expect(result.current.data).toBe(true)
		expect(fetchUserData).not.toHaveBeenCalled()
	})

	test('seeds the cache only for items that render', async () => {
		await renderIsFavorite({ Id: 'rendered', UserData: { Key: 'value', IsFavorite: false } })

		expect(queryClient.getQueryData(UserDataQueryKey(user, 'rendered'))).toEqual({
			Key: 'value',
			IsFavorite: false,
		})
		expect(queryClient.getQueryData(UserDataQueryKey(user, 'not-rendered'))).toBeUndefined()
	})

	test('prefers cached user data over the item user data', async () => {
		queryClient.setQueryData(UserDataQueryKey(user, 'track'), { IsFavorite: true })

		const { result } = await renderIsFavorite({
			Id: 'track',
			UserData: { Key: 'value', IsFavorite: false },
		})

		expect(result.current.data).toBe(true)
		expect(fetchUserData).not.toHaveBeenCalled()
	})

	test('fetches user data when the item has none', async () => {
		;(fetchUserData as jest.Mock).mockResolvedValueOnce({ IsFavorite: true })

		const { result } = await renderIsFavorite({ Id: 'track' })

		await waitFor(() => expect(result.current.data).toBe(true))
		expect(fetchUserData).toHaveBeenCalledWith('track', expect.anything())
	})

	test('treats missing IsFavorite as not favorited', async () => {
		const { result } = await renderIsFavorite({ Id: 'track', UserData: { Key: 'value' } })

		expect(result.current.data).toBe(false)
	})
})
