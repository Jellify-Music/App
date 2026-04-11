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

jest.mock('@react-navigation/material-top-tabs', () => {
	const RN = require('react-native')
	const RE = require('react')
	const Navigator = ({ children, tabBar }: any) => {
		const TabBar = tabBar
		return RE.createElement(
			RN.View,
			{ testID: 'library-navigator' },
			TabBar && RE.createElement(TabBar),
			children,
		)
	}
	const Screen = ({ name, options }: any) => {
		return RE.createElement(
			RN.View,
			{ testID: options?.tabBarButtonTestID ?? name },
			RE.createElement(RN.Text, null, name),
		)
	}
	return {
		createMaterialTopTabNavigator: () => ({
			Navigator,
			Screen,
		}),
	}
})

jest.mock('../../src/components/Library/components/tracks-tab', () => {
	const RN = require('react-native')
	const RE = require('react')
	return {
		__esModule: true,
		default: () => RE.createElement(RN.View, { testID: 'tracks-tab-content' }),
	}
})

jest.mock('../../src/components/Library/components/artists-tab', () => {
	const RN = require('react-native')
	const RE = require('react')
	return {
		__esModule: true,
		default: () => RE.createElement(RN.View, { testID: 'artists-tab-content' }),
	}
})

jest.mock('../../src/components/Library/components/albums-tab', () => {
	const RN = require('react-native')
	const RE = require('react')
	return {
		__esModule: true,
		default: () => RE.createElement(RN.View, { testID: 'albums-tab-content' }),
	}
})

jest.mock('../../src/components/Library/components/playlists-tab', () => {
	const RN = require('react-native')
	const RE = require('react')
	return {
		__esModule: true,
		default: () => RE.createElement(RN.View, { testID: 'playlists-tab-content' }),
	}
})

jest.mock('../../src/components/Library/tab-bar', () => {
	const RN = require('react-native')
	const RE = require('react')
	return {
		__esModule: true,
		default: () => RE.createElement(RN.View, { testID: 'library-tab-bar' }),
	}
})

import LibraryScreen from '../../src/components/Library/component'

const mockRoute = {
	params: {},
	key: 'LibraryScreen',
	name: 'LibraryScreen',
} as any

const mockNavigation = {
	navigate: jest.fn(),
	setOptions: jest.fn(),
	goBack: jest.fn(),
} as any

function renderLibrary() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<LibraryScreen route={mockRoute} navigation={mockNavigation} />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('Library Screen', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders the library navigator', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-navigator')).toBeTruthy()
	})

	it('has Artists tab with correct testID', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-artists-tab-button')).toBeTruthy()
	})

	it('has Albums tab with correct testID', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-albums-tab-button')).toBeTruthy()
	})

	it('has Tracks tab with correct testID', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-tracks-tab-button')).toBeTruthy()
	})

	it('has Playlists tab with correct testID', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-playlists-tab-button')).toBeTruthy()
	})

	it('renders the custom tab bar', () => {
		const { getByTestId } = renderLibrary()
		expect(getByTestId('library-tab-bar')).toBeTruthy()
	})
})
