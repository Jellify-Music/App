import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import FavoriteButton from '../../src/components/Global/components/favorite-button'

const mockAddFavoriteMutate = jest.fn()
const mockRemoveFavoriteMutate = jest.fn()

jest.mock('../../src/api/mutations/favorite', () => ({
	useAddFavorite: jest.fn(() => ({
		mutate: mockAddFavoriteMutate,
		isPending: false,
	})),
	useRemoveFavorite: jest.fn(() => ({
		mutate: mockRemoveFavoriteMutate,
		isPending: false,
	})),
}))

jest.mock('../../src/api/queries/user-data', () => ({
	useIsFavorite: jest.fn(() => ({
		data: false,
		isPending: false,
	})),
}))

jest.mock('../../src/components/Global/components/icon', () => {
	const { TouchableOpacity, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ name, onPress }: { name: string; onPress?: () => void }) => (
			<TouchableOpacity onPress={onPress} testID={`icon-${name}`}>
				<Text>{name}</Text>
			</TouchableOpacity>
		),
	}
})

import { useIsFavorite } from '../../src/api/queries/user-data'

function renderFavoriteButton(item = { Id: 'item-1', Name: 'Test' }) {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<FavoriteButton item={item} />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('FavoriteButton', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('shows spinner when query is pending', () => {
		;(useIsFavorite as jest.Mock).mockReturnValue({
			data: undefined,
			isPending: true,
		})

		const { queryByTestId } = renderFavoriteButton()
		// When isPending, a Spinner is shown instead of an icon
		expect(queryByTestId('icon-heart')).toBeNull()
		expect(queryByTestId('icon-heart-outline')).toBeNull()
	})

	it('shows filled heart when item is a favorite', () => {
		;(useIsFavorite as jest.Mock).mockReturnValue({
			data: true,
			isPending: false,
		})

		const { getByTestId } = renderFavoriteButton()
		expect(getByTestId('icon-heart')).toBeTruthy()
	})

	it('shows outline heart when item is not a favorite', () => {
		;(useIsFavorite as jest.Mock).mockReturnValue({
			data: false,
			isPending: false,
		})

		const { getByTestId } = renderFavoriteButton()
		expect(getByTestId('icon-heart-outline')).toBeTruthy()
	})

	it('calls removeFavorite mutation when pressing filled heart', () => {
		;(useIsFavorite as jest.Mock).mockReturnValue({
			data: true,
			isPending: false,
		})

		const { getByTestId } = renderFavoriteButton()
		fireEvent.press(getByTestId('icon-heart'))

		expect(mockRemoveFavoriteMutate).toHaveBeenCalledWith({
			item: { Id: 'item-1', Name: 'Test' },
			onToggle: undefined,
		})
	})

	it('calls addFavorite mutation when pressing outline heart', () => {
		;(useIsFavorite as jest.Mock).mockReturnValue({
			data: false,
			isPending: false,
		})

		const { getByTestId } = renderFavoriteButton()
		fireEvent.press(getByTestId('icon-heart-outline'))

		expect(mockAddFavoriteMutate).toHaveBeenCalledWith({
			item: { Id: 'item-1', Name: 'Test' },
			onToggle: undefined,
		})
	})
})
