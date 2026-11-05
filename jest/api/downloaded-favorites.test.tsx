import React from 'react'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import { queryClient } from '../../src/api/client'
import useTracks from '../../src/api/queries/track'
import UserDataQueryKey from '../../src/api/queries/user-data/keys'
import { LibrarySectionListData } from '../../src/components/Global/types'
import { JellifyUser } from '../../src/types/JellifyUser'

const user = { id: 'user' } as JellifyUser

const mockDownloadedTracks = jest.fn()

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(() => ({})),
	getUser: jest.fn(() => ({ id: 'user' })),
	getLibrary: jest.fn(),
}))

jest.mock('../../src/stores/auth', () => ({
	useJellifyLibrary: () => [{ musicLibraryId: 'library' }],
}))

jest.mock('../../src/stores/library', () => ({
	__esModule: true,
	default: () => ({
		filters: { tracks: { isDownloaded: true, isFavorites: true } },
		sortBy: { tracks: undefined },
		sortDescending: { tracks: false },
	}),
}))

jest.mock('react-native-nitro-player', () => ({
	useDownloadedTracks: () => ({ downloadedTracks: mockDownloadedTracks() }),
}))

/**
 * A downloaded track as the app stores it: the full item DTO, including the `UserData` it had when
 * it was downloaded, is serialised into `extraPayload.item`.
 */
const downloaded = (id: string, isFavorite: boolean) => ({
	originalTrack: {
		id,
		title: id,
		extraPayload: {
			item: JSON.stringify({
				Id: id,
				Name: id,
				UserData: { Key: id, IsFavorite: isFavorite },
			}),
		},
	},
})

describe('downloaded tracks with the favorites filter', () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)

	const favoritesShown = async () => {
		const { result } = await renderHook(
			() => useTracks(ItemSortBy.Name, SortOrder.Ascending, true, undefined),
			{
				wrapper,
			},
		)

		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		// With the default name sort the list is grouped into letter sections of items
		return ((result.current.data ?? []) as LibrarySectionListData[])
			.flatMap((section) => section.data)
			.map((track) => track.Id)
			.sort()
	}

	beforeEach(() => {
		queryClient.clear()
		mockDownloadedTracks.mockReturnValue([
			downloaded('favorite', true),
			downloaded('plain', false),
			downloaded('unfavorited-since', true),
			downloaded('favorited-since', false),
		])
	})

	afterAll(() => queryClient.clear())

	test('keeps downloaded favorites that were never rendered this session', async () => {
		// Nothing has rendered, so nothing is in the user data cache: this is the cold-start case
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0)

		expect(await favoritesShown()).toEqual(['favorite', 'unfavorited-since'])
	})

	test('honours favorites toggled in the app since the download', async () => {
		queryClient.setQueryData(UserDataQueryKey(user, 'unfavorited-since'), { IsFavorite: false })
		queryClient.setQueryData(UserDataQueryKey(user, 'favorited-since'), { IsFavorite: true })

		expect(await favoritesShown()).toEqual(['favorite', 'favorited-since'])
	})
})
