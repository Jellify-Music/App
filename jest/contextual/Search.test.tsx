/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import Search from '../../src/components/Search'

// ── Storage mock (needed for all Zustand stores) ────────────────────────────
jest.mock('../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

// ── Search query hook mock ──────────────────────────────────────────────────
const mockSearchResults = jest.fn()
jest.mock('../../src/api/queries/search', () => ({
	__esModule: true,
	default: jest.fn(() => mockSearchResults()),
}))

// ── FlashList mock ──────────────────────────────────────────────────────────
jest.mock('@shopify/flash-list', () => {
	const { FlatList } = require('react-native')
	return {
		FlashList: ({
			ListHeaderComponent,
			ListEmptyComponent,
			data,
			renderItem,
			...props
		}: any) => {
			const header =
				typeof ListHeaderComponent === 'function' ? (
					<ListHeaderComponent />
				) : (
					ListHeaderComponent
				)
			const empty =
				typeof ListEmptyComponent === 'function' ? (
					<ListEmptyComponent />
				) : (
					ListEmptyComponent
				)
			return (
				<FlatList
					{...props}
					data={data}
					renderItem={renderItem}
					ListHeaderComponent={header}
					ListEmptyComponent={empty}
				/>
			)
		},
	}
})

// ── Component mocks ─────────────────────────────────────────────────────────
jest.mock('../../src/components/Search/suggestions', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: () => <View testID='suggestions-component' />,
	}
})

jest.mock('../../src/components/Global/helpers/input', () => {
	const { TextInput } = require('react-native')
	return {
		__esModule: true,
		default: ({ testID, onChangeText, placeholder, value, ...props }: any) => (
			<TextInput
				testID={testID}
				onChangeText={onChangeText}
				placeholder={placeholder}
				value={value ?? ''}
			/>
		),
	}
})

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		H5: (props: any) => <RNText {...props} />,
		Text: (props: any) => <RNText {...props} />,
	}
})

jest.mock('../../src/components/Global/components/item-row', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ item }: any) => (
			<View testID={`item-row-${item.Id}`}>
				<Text>{item.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/item-card', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ item, testID }: any) => (
			<View testID={testID}>
				<Text>{item.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/horizontal-list', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: ({ data, renderItem, testID }: any) => (
			<View testID={testID}>
				{data?.map((item: any, index: number) => (
					<View key={item.Id ?? index}>{renderItem({ item, index })}</View>
				))}
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/Track', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ track }: any) => (
			<View testID={`track-${track.Id}`}>
				<Text>{track.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/swipeable-row-registry', () => ({
	closeAllSwipeableRows: jest.fn(),
}))

// ── Navigation mocks ────────────────────────────────────────────────────────
jest.mock('../../src/screens/navigation', () => ({
	__esModule: true,
	default: { dispatch: jest.fn() },
}))

// ── Utility mocks ───────────────────────────────────────────────────────────
jest.mock('../../src/utils/parsing/random', () => ({
	pickRandomItemFromArray: jest.fn((arr: any[]) => arr?.[0] ?? 'Search for songs'),
}))

jest.mock('../../src/configs/placeholder.config', () => ({
	SEARCH_PLACEHOLDERS: ['Search for songs'],
}))

jest.mock('../../src/utils/formatting/artist-names', () => ({
	formatArtistName: jest.fn((name: string) => name),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────
const mockNavigation = {
	push: jest.fn(),
	navigate: jest.fn(),
	goBack: jest.fn(),
	dispatch: jest.fn(),
	setOptions: jest.fn(),
	addListener: jest.fn(() => jest.fn()),
} as any

function renderSearch() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<Search navigation={mockNavigation} />
			</Theme>
		</TamaguiProvider>,
	)
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('Search', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockSearchResults.mockReturnValue({ data: undefined, isFetching: false })
	})

	it('renders the search input', () => {
		const { getByTestId } = renderSearch()
		expect(getByTestId('search-input')).toBeTruthy()
	})

	it('shows suggestions when no search is active', () => {
		const { getByTestId } = renderSearch()
		expect(getByTestId('suggestions-component')).toBeTruthy()
	})

	// Tests that need fake timers for debounce behavior are grouped here
	// so that timer cleanup happens in afterEach even if a test throws.
	describe('debounced search', () => {
		beforeEach(() => {
			jest.useFakeTimers()
		})

		afterEach(() => {
			jest.useRealTimers()
		})

		it('shows "No Results" when search returns empty', () => {
			mockSearchResults.mockReturnValue({ data: [], isFetching: false })

			const { getByTestId, getByText } = renderSearch()
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'test query')

			act(() => {
				jest.advanceTimersByTime(500)
			})

			expect(getByText('No Results')).toBeTruthy()
		})

		it('shows "Results" header when search returns items', () => {
			mockSearchResults.mockReturnValue({
				data: [
					{ Id: '1', Name: 'Artist A', Type: 'MusicArtist' },
					{ Id: '2', Name: 'Song B', Type: 'Audio' },
				],
				isFetching: false,
			})

			const { getByTestId, getByText } = renderSearch()
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'test query')

			act(() => {
				jest.advanceTimersByTime(500)
			})

			expect(getByText('Results')).toBeTruthy()
		})

		it('shows spinner while fetching', () => {
			mockSearchResults.mockReturnValue({ data: undefined, isFetching: true })

			const { getByTestId, UNSAFE_getByType } = renderSearch()
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'test query')

			act(() => {
				jest.advanceTimersByTime(500)
			})

			const { ActivityIndicator } = require('react-native')
			expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
		})
	})
})
