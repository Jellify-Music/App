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

jest.mock('../../src/components/Settings/components/settings-list-group', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ settingsList }: any) => (
			<View testID='settings-list'>
				{settingsList.map((item: any, i: number) => (
					<View key={i} testID={`setting-${i}`}>
						<Text>{item.title}</Text>
						<Text>{item.subTitle}</Text>
						{item.children}
					</View>
				))}
			</View>
		),
	}
})

jest.mock('../../src/components/Global/helpers/radio-group-item-with-label', () => {
	const { Text } = require('react-native')
	return { RadioGroupItemWithLabel: ({ label }: any) => <Text>{label}</Text> }
})

jest.mock('../../src/components/Global/helpers/switch-with-label', () => {
	const { Text } = require('react-native')
	return { SwitchWithLabel: ({ label }: any) => <Text>{label}</Text> }
})

jest.mock('../../src/components/Global/helpers/checkbox-with-label', () => {
	const { Text } = require('react-native')
	return { CheckboxWithLabel: ({ label }: any) => <Text>{label}</Text> }
})

jest.mock('../../src/components/Global/components/icon', () => ({
	__esModule: true,
	default: () => null,
}))

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		Text: (props: any) => <RNText {...props} />,
		H2: (props: any) => <RNText {...props} />,
	}
})

// PlaybackTab mocks
jest.mock('../../src/stores/settings/player', () => ({
	useStreamingQuality: jest.fn(() => ['original', jest.fn()]),
	useEnableAudioNormalization: jest.fn(() => [false, jest.fn()]),
	useDisplayAudioQualityBadge: jest.fn(() => [false, jest.fn()]),
}))

// GesturesTab mocks
jest.mock('../../src/stores/settings/swipe', () => ({
	useSwipeSettingsStore: jest.fn((selector: any) => {
		const state = {
			left: ['ToggleFavorite', 'AddToPlaylist'],
			right: ['AddToQueue'],
			toggleLeft: jest.fn(),
			toggleRight: jest.fn(),
		}
		return typeof selector === 'function' ? selector(state) : state
	}),
	SwipeActionType: {},
}))

// InfoTab mocks
jest.mock('../../package.json', () => ({ version: '1.0.0' }))
jest.mock('../../src/api/queries/patrons', () => ({
	__esModule: true,
	default: jest.fn(() => []),
}))
jest.mock('react-native-nitro-ota', () => ({
	getStoredOtaVersion: jest.fn(() => null),
}))
jest.mock('../../src/hooks/use-caption', () => ({
	useInfoCaption: jest.fn(() => ({ data: 'Test caption' })),
}))
jest.mock('../../src/components/OtaUpdates', () => ({
	downloadUpdate: jest.fn(),
}))

import PlaybackTab from '../../src/components/Settings/components/playback-tab'
import GesturesTab from '../../src/components/Settings/components/gestures-tab'
import InfoTab from '../../src/components/Settings/components/info-tab'

function renderWithTheme(component: React.ReactElement) {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>{component}</Theme>
		</TamaguiProvider>,
	)
}

describe('Settings Screen', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('PlaybackTab', () => {
		it('renders "Streaming Quality" title', () => {
			const { getByText } = renderWithTheme(<PlaybackTab />)
			expect(getByText('Streaming Quality')).toBeTruthy()
		})

		it('renders "Audio Normalization" title', () => {
			const { getByText } = renderWithTheme(<PlaybackTab />)
			expect(getByText('Audio Normalization')).toBeTruthy()
		})

		it('renders "Quality Badge" title', () => {
			const { getByText } = renderWithTheme(<PlaybackTab />)
			expect(getByText('Quality Badge')).toBeTruthy()
		})

		it('shows radio options for streaming quality', () => {
			const { getByText } = renderWithTheme(<PlaybackTab />)
			expect(getByText('Original Quality')).toBeTruthy()
			expect(getByText('High (320kbps)')).toBeTruthy()
			expect(getByText('Medium (192kbps)')).toBeTruthy()
			expect(getByText('Low (128kbps)')).toBeTruthy()
		})
	})

	describe('GesturesTab', () => {
		it('renders "Swipe Left on Track" title', () => {
			const { getByText } = renderWithTheme(<GesturesTab />)
			expect(getByText('Swipe Left on Track')).toBeTruthy()
		})

		it('renders "Swipe Right on Track" title', () => {
			const { getByText } = renderWithTheme(<GesturesTab />)
			expect(getByText('Swipe Right on Track')).toBeTruthy()
		})

		it('shows all 3 action checkboxes', () => {
			const { getAllByText } = renderWithTheme(<GesturesTab />)
			// Each action label appears twice: once for left, once for right
			expect(getAllByText('Add to queue')).toHaveLength(2)
			expect(getAllByText('Toggle favorite')).toHaveLength(2)
			expect(getAllByText('Add to playlist')).toHaveLength(2)
		})
	})

	describe('InfoTab', () => {
		it('renders app version', () => {
			const { getByText } = renderWithTheme(<InfoTab />)
			expect(getByText('Jellify 1.0.0')).toBeTruthy()
		})

		it('shows "Caught a bug?" section', () => {
			const { getByText } = renderWithTheme(<InfoTab />)
			expect(getByText('Caught a bug?')).toBeTruthy()
		})

		it('shows "Wall of Fame" section', () => {
			const { getByText } = renderWithTheme(<InfoTab />)
			expect(getByText('Wall of Fame')).toBeTruthy()
		})

		it('shows "View Source" and "Report Issue" links', () => {
			const { getByText } = renderWithTheme(<InfoTab />)
			expect(getByText('View Source')).toBeTruthy()
			expect(getByText('Report Issue')).toBeTruthy()
		})
	})
})
