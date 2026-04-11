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

jest.mock('../../src/components/Discover/helpers/just-added', () => {
	const { View } = require('react-native')
	return { __esModule: true, default: () => <View testID='recently-added' /> }
})

jest.mock('../../src/components/Discover/helpers/public-playlists', () => {
	const { View } = require('react-native')
	return { __esModule: true, default: () => <View testID='public-playlists' /> }
})

jest.mock('../../src/components/Discover/helpers/suggested-artists', () => {
	const { View } = require('react-native')
	return { __esModule: true, default: () => <View testID='suggested-artists' /> }
})

jest.mock('../../src/components/Discover/helpers/suggested-albums', () => {
	const { View } = require('react-native')
	return { __esModule: true, default: () => <View testID='suggested-albums' /> }
})

jest.mock('../../src/api/mutations/discover', () => ({
	__esModule: true,
	default: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}))

jest.mock('../../src/api/queries/album', () => ({
	useRecentlyAddedAlbums: jest.fn(() => ({ isPending: false })),
}))

jest.mock('@tanstack/react-query', () => ({
	...jest.requireActual('@tanstack/react-query'),
	useIsRestoring: jest.fn(() => false),
}))

import Discover from '../../src/components/Discover/component'

function renderDiscover() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<Discover />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('Discover Screen', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders all four discover sections', () => {
		const { getByTestId } = renderDiscover()

		expect(getByTestId('recently-added')).toBeTruthy()
		expect(getByTestId('public-playlists')).toBeTruthy()
		expect(getByTestId('suggested-artists')).toBeTruthy()
		expect(getByTestId('suggested-albums')).toBeTruthy()
	})

	it('shows pull-to-refresh control', () => {
		const { UNSAFE_root } = renderDiscover()

		// The ScrollView receives a refreshControl prop via the mocked
		// RefreshControl (which is a plain View in test setup).
		// Walk the tree to find a node whose props include refreshing.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function findRefreshControl(node: any): any {
			if (node?.props?.refreshing !== undefined) return node
			const children = node?.children ?? node?.props?.children
			if (!Array.isArray(children)) return null
			for (const child of children) {
				const found = findRefreshControl(child)
				if (found) return found
			}
			return null
		}

		const refreshNode = findRefreshControl(UNSAFE_root)
		expect(refreshNode).toBeTruthy()
	})
})
