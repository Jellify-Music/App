import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import config from '../../src/configs/tamagui.config'
import PlaylistsTab from '../../src/components/Artist/tabs/playlists'

const mockNavigate = jest.fn()
const mockRetry = jest.fn()
const mockRefresh = jest.fn()
let mockHook: Record<string, unknown> = {}

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../src/providers/Artist', () => ({
	useArtistContext: () => ({ artist: { Id: 'artist-1', Name: 'Wardruna' } }),
}))

jest.mock('../../src/hooks/use-artist-playlists', () => ({
	useArtistPlaylists: () => mockHook,
}))

// Rows and the list are replaced by plain ones, so what is tested is what this tab decides to show
jest.mock('../../src/components/Global/components/item-row', () => {
	const { createElement } = require('react')
	const { Pressable, Text } = require('react-native')

	const MockItemRow = ({ item, onPress }: { item: BaseItemDto; onPress: () => void }) =>
		createElement(
			Pressable,
			{ testID: `row-${item.Id}`, onPress },
			createElement(Text, null, item.Name),
		)
	MockItemRow.displayName = 'MockItemRow'

	return MockItemRow
})

// The artist's header and tab bar start the list, but are tested elsewhere
jest.mock('../../src/components/Artist/list-header', () => {
	const { createElement } = require('react')
	const { View } = require('react-native')

	const MockListHeader = () => createElement(View, { testID: 'artist-list-header' })
	MockListHeader.displayName = 'MockListHeader'

	return MockListHeader
})

jest.mock('../../src/components/Global/components/Lists/utils', () => {
	const { createElement } = require('react')
	const { FlatList } = require('react-native')

	return { __esModule: true, default: (props: object) => createElement(FlatList, props) }
})

const mine: BaseItemDto = { Id: 'mine', Name: 'My mix' }
const shared: BaseItemDto = { Id: 'shared', Name: 'Library mix' }

const state = (overrides: Record<string, unknown> = {}) => ({
	playlists: [],
	userPlaylistIds: new Set(['mine']),
	isPending: false,
	checked: 0,
	total: 0,
	failedPlaylists: 0,
	failedLists: 0,
	isRefreshing: false,
	retry: mockRetry,
	refresh: mockRefresh,
	...overrides,
})

const renderTab = () =>
	render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<PlaylistsTab />
		</TamaguiProvider>,
	)

beforeEach(() => {
	jest.clearAllMocks()
	mockHook = state()
})

describe('artist Playlists tab', () => {
	it('says so when the artist is on no playlists', async () => {
		const screen = await renderTab()

		expect(screen.getByText("Wardruna isn't on any playlists")).toBeTruthy()
		expect(screen.queryByTestId('artist-playlists-progress')).toBeNull()
	})

	it('shows how far along it is while there is nothing to show yet', async () => {
		mockHook = state({ isPending: true, checked: 1250, total: 10004 })

		const screen = await renderTab()

		expect(screen.getByText('Checked 1,250 of 10,004 playlists')).toBeTruthy()
		expect(screen.queryByText(/isn't on any playlists/)).toBeNull()
	})

	it('has nothing to count before the playlist lists have loaded', async () => {
		mockHook = state({ isPending: true })

		const screen = await renderTab()

		expect(screen.getByText('Looking through your playlists')).toBeTruthy()
	})

	it('lists what has been found, and keeps showing progress while it looks at the rest', async () => {
		mockHook = state({ playlists: [mine, shared], isPending: true, checked: 40, total: 100 })

		const screen = await renderTab()

		expect(screen.getByText('My mix')).toBeTruthy()
		expect(screen.getByText('Library mix')).toBeTruthy()
		expect(screen.getByText('Checked 40 of 100 playlists')).toBeTruthy()
	})

	it('stops showing progress once it has looked at everything', async () => {
		mockHook = state({ playlists: [mine], checked: 100, total: 100 })

		const screen = await renderTab()

		expect(screen.queryByTestId('artist-playlists-progress')).toBeNull()
	})

	it('opens a playlist, editable only if it is one of the user’s own', async () => {
		mockHook = state({ playlists: [mine, shared] })

		const screen = await renderTab()

		await fireEvent.press(screen.getByTestId('row-mine'))
		expect(mockNavigate).toHaveBeenLastCalledWith('Playlist', { playlist: mine, canEdit: true })

		await fireEvent.press(screen.getByTestId('row-shared'))
		expect(mockNavigate).toHaveBeenLastCalledWith('Playlist', {
			playlist: shared,
			canEdit: false,
		})
	})

	it.each([
		[{ failedPlaylists: 1 }, "Couldn't check a playlist. Tap to retry"],
		[{ failedPlaylists: 3 }, "Couldn't check 3 playlists. Tap to retry"],
		[{ failedLists: 1 }, "Couldn't load one of your playlist lists. Tap to retry"],
		[{ failedLists: 2 }, "Couldn't load your playlists. Tap to retry"],
		// a playlist list failing is the bigger problem, so it is what gets reported
		[
			{ failedLists: 1, failedPlaylists: 4 },
			"Couldn't load one of your playlist lists. Tap to retry",
		],
	])(
		'tells the user when something could not be looked at (%j), and retries when tapped',
		async (failures, message) => {
			mockHook = state({ playlists: [mine], ...failures })

			const screen = await renderTab()

			expect(screen.getByText(message)).toBeTruthy()

			await fireEvent.press(screen.getByTestId('artist-playlists-retry'))
			expect(mockRetry).toHaveBeenCalledTimes(1)
		},
	)

	it('offers the retry even when there is nothing else to show', async () => {
		mockHook = state({ failedLists: 1 })

		const screen = await renderTab()

		expect(screen.getByTestId('artist-playlists-retry')).toBeTruthy()
		expect(screen.getByText("Wardruna isn't on any playlists")).toBeTruthy()
	})

	it('starts the list with the artist header and tabs, so they scroll away with it', async () => {
		mockHook = state({ playlists: [mine] })

		const screen = await renderTab()

		expect(screen.getByTestId('artist-list-header')).toBeTruthy()
	})

	it('shows no failure notice when nothing failed', async () => {
		mockHook = state({ playlists: [mine] })

		const screen = await renderTab()

		expect(screen.queryByTestId('artist-playlists-retry')).toBeNull()
	})

	it('refreshes the playlist lists when pulled down, showing that it is refreshing', async () => {
		mockHook = state({ playlists: [mine], isRefreshing: true })

		const screen = await renderTab()

		const list = screen.getByTestId('artist-playlists-list')

		expect(list.props.refreshControl.props.refreshing).toBe(true)

		list.props.refreshControl.props.onRefresh()

		expect(mockRefresh).toHaveBeenCalledTimes(1)
	})
})
