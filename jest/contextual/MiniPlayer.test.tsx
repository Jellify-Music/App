import React from 'react'
import { render } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import Miniplayer from '../../src/components/Player/mini-player'

jest.mock('../../src/stores/player/queue', () => ({
	useCurrentTrack: jest.fn(() => undefined),
}))

jest.mock('../../src/utils/mapping/track-extra-payload', () => ({
	__esModule: true,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default: jest.fn((track: any) =>
		track ? { Id: track.id, Name: track.title, Artists: [track.artist] } : undefined,
	),
}))

jest.mock('../../src/hooks/player', () => ({
	useProgress: jest.fn(() => ({ position: 0, totalDuration: 180 })),
}))

jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn(() => ({
		navigate: jest.fn(),
	})),
}))

jest.mock('react-native-text-ticker', () => {
	const { Text } = require('react-native')
	return {
		__esModule: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		default: (props: any) => <Text {...props} />,
	}
})

jest.mock('../../src/components/Player/components/buttons', () => ({
	PlayPauseIcon: () => null,
}))

jest.mock('../../src/components/Global/components/image', () => ({
	__esModule: true,
	default: () => null,
}))

jest.mock('../../src/hooks/player/functions/controls', () => ({
	previous: jest.fn(),
	skip: jest.fn(),
}))

import { useCurrentTrack } from '../../src/stores/player/queue'

function renderMiniPlayer() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<Miniplayer />
			</Theme>
		</TamaguiProvider>,
	)
}

// Suppress React Native Animated act() warnings — SpringAnimation fires
// requestAnimationFrame callbacks outside act() after the test completes.
const originalConsoleError = console.error
beforeAll(() => {
	jest.spyOn(console, 'error').mockImplementation((...args) => {
		if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
		originalConsoleError(...args)
	})
})

afterAll(() => {
	jest.restoreAllMocks()
})

describe('Miniplayer', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders nothing when no current track', () => {
		;(useCurrentTrack as jest.Mock).mockReturnValue(undefined)

		const { toJSON } = renderMiniPlayer()
		expect(toJSON()).toBeNull()
	})

	it('renders track title and artist when track is present', () => {
		;(useCurrentTrack as jest.Mock).mockReturnValue({
			id: 'track-1',
			title: 'Test Song',
			artist: 'Cool Artist',
		})

		const { getByTestId, getByText } = renderMiniPlayer()
		expect(getByTestId('miniplayer-test-id')).toBeTruthy()
		expect(getByText('Test Song')).toBeTruthy()
		expect(getByText('Cool Artist')).toBeTruthy()
	})
})
