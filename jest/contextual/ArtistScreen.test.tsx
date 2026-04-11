/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'

jest.mock('../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			getNumber: jest.fn(() => undefined),
			remove: jest.fn((key: string) => map.delete(key)),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

const mockArtistContext = jest.fn()
jest.mock('../../src/providers/Artist', () => ({
	useArtistContext: jest.fn(() => mockArtistContext()),
}))

jest.mock('../../src/components/Artist/header', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: () => (
			<View testID='artist-header'>
				<Text>Artist Header</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Artist/similar', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: () => (
			<View testID='similar-artists'>
				<Text>Similar Artists</Text>
			</View>
		),
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

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		Text: (props: any) => <RNText {...props} />,
	}
})

jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn(() => ({
		navigate: jest.fn(),
		push: jest.fn(),
	})),
}))

import ArtistOverviewTab from '../../src/components/Artist/OverviewTab'

const mockArtist = {
	Id: 'artist-1',
	Name: 'Test Artist',
	Type: 'MusicArtist',
}

const mockNavigation = {
	navigate: jest.fn(),
	push: jest.fn(),
	setOptions: jest.fn(),
	goBack: jest.fn(),
} as any

function renderArtistOverview() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<ArtistOverviewTab navigation={mockNavigation} />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('Artist Overview Tab', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders the artist overview with artist data from context', () => {
		mockArtistContext.mockReturnValue({
			artist: mockArtist,
			albums: [],
			featuredOn: [],
			similarArtists: [],
			fetchingAlbums: false,
			fetchingFeaturedOn: false,
			fetchingSimilarArtists: false,
			refresh: jest.fn(),
		})

		const { getByTestId } = renderArtistOverview()

		expect(getByTestId('artist-header')).toBeTruthy()
	})

	it('shows albums section when artist has albums', () => {
		const albumData = [
			{ Id: 'album-1', Name: 'Full Album', RunTimeTicks: 36000000000 },
			{ Id: 'album-2', Name: 'Second Album', RunTimeTicks: 40000000000 },
		]

		mockArtistContext.mockReturnValue({
			artist: mockArtist,
			albums: albumData,
			featuredOn: [],
			similarArtists: [],
			fetchingAlbums: false,
			fetchingFeaturedOn: false,
			fetchingSimilarArtists: false,
			refresh: jest.fn(),
		})

		const { getByText, getByTestId } = renderArtistOverview()

		expect(getByText('Albums')).toBeTruthy()
		expect(getByTestId('item-row-album-1')).toBeTruthy()
		expect(getByTestId('item-row-album-2')).toBeTruthy()
	})

	it('shows similar artists when available', () => {
		mockArtistContext.mockReturnValue({
			artist: mockArtist,
			albums: [],
			featuredOn: [],
			similarArtists: [{ Id: 'sim-1', Name: 'Similar Artist 1' }],
			fetchingAlbums: false,
			fetchingFeaturedOn: false,
			fetchingSimilarArtists: false,
			refresh: jest.fn(),
		})

		const { getByTestId } = renderArtistOverview()

		expect(getByTestId('similar-artists')).toBeTruthy()
	})
})
