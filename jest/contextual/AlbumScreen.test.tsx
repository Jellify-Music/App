/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render } from '@testing-library/react-native'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'

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

const mockAlbumDiscs = jest.fn()
jest.mock('../../src/api/queries/album', () => ({
	useAlbumDiscs: jest.fn(() => mockAlbumDiscs()),
}))

jest.mock('../../src/hooks/downloads', () => ({
	useIsDownloaded: jest.fn(() => false),
	useAreAllDownloaded: jest.fn(() => false),
}))

jest.mock('../../src/hooks/downloads/mutations', () => ({
	__esModule: true,
	default: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
	useDeleteDownloads: jest.fn(() => ({ mutate: jest.fn() })),
}))

jest.mock('../../src/components/Album/header', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ album }: any) => (
			<View testID='album-header'>
				<Text>{album.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Album/footer', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: () => <View testID='album-footer' />,
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

jest.mock('../../src/components/Global/components/favorite-button', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: () => <View testID='favorite-button' />,
	}
})

jest.mock('../../src/components/Global/components/icon', () => ({
	__esModule: true,
	default: () => null,
}))

jest.mock('../../src/components/Global/components/swipeable-row-registry', () => ({
	closeAllSwipeableRows: jest.fn(),
}))

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		Text: (props: any) => <RNText {...props} />,
	}
})

const mockSetOptions = jest.fn()
jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn(() => ({
		setOptions: mockSetOptions,
		navigate: jest.fn(),
		push: jest.fn(),
	})),
}))

import { Album } from '../../src/components/Album'

const mockAlbum = {
	Id: 'album-1',
	Name: 'Test Album',
	AlbumArtist: 'Test Artist',
	ProductionYear: 2024,
	Type: BaseItemKind.MusicAlbum,
}

function renderAlbum() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<Album album={mockAlbum} />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('Album Screen', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('shows header component for the album', () => {
		mockAlbumDiscs.mockReturnValue({
			data: [{ title: '1', data: [{ Id: 't1', Name: 'Track 1' }] }],
			isPending: false,
			refetch: jest.fn(),
		})

		const { getByTestId, getByText } = renderAlbum()

		expect(getByTestId('album-header')).toBeTruthy()
		expect(getByText('Test Album')).toBeTruthy()
	})

	it('renders track items when disc data is available', () => {
		mockAlbumDiscs.mockReturnValue({
			data: [
				{
					title: '1',
					data: [
						{ Id: 't1', Name: 'Track 1' },
						{ Id: 't2', Name: 'Track 2' },
					],
				},
			],
			isPending: false,
			refetch: jest.fn(),
		})

		const { getByTestId, getByText } = renderAlbum()

		expect(getByTestId('track-t1')).toBeTruthy()
		expect(getByTestId('track-t2')).toBeTruthy()
		expect(getByText('Track 1')).toBeTruthy()
		expect(getByText('Track 2')).toBeTruthy()
	})

	it('shows "No album tracks" when empty and not loading', () => {
		mockAlbumDiscs.mockReturnValue({
			data: [],
			isPending: false,
			refetch: jest.fn(),
		})

		const { getByText } = renderAlbum()

		expect(getByText('No album tracks')).toBeTruthy()
	})

	it('shows the favorite button in header', () => {
		mockAlbumDiscs.mockReturnValue({
			data: [{ title: '1', data: [{ Id: 't1', Name: 'Track 1' }] }],
			isPending: false,
			refetch: jest.fn(),
		})

		renderAlbum()

		expect(mockSetOptions).toHaveBeenCalled()
		const headerRightCall = mockSetOptions.mock.calls[0][0]
		const headerRight = headerRightCall.headerRight

		const { getByTestId } = render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<Theme name='purple_dark'>{headerRight()}</Theme>
			</TamaguiProvider>,
		)

		expect(getByTestId('favorite-button')).toBeTruthy()
	})
})
