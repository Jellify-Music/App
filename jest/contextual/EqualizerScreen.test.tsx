import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider, Theme } from 'tamagui'
import {
	useEqualizer,
	useEqualizerPresets,
	type EqualizerBand,
	type EqualizerPreset,
} from 'react-native-nitro-player'

import EqualizerScreen from '../../src/screens/Settings/equalizer'
import { useIsCasting } from '../../src/stores/player/engine'
import config from '../../src/configs/tamagui.config'

jest.mock('../../src/stores/player/engine', () => ({
	useIsCasting: jest.fn().mockReturnValue(false),
}))

const FREQUENCIES = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

const BUILT_IN_PRESET_NAMES = [
	'Flat',
	'Rock',
	'Pop',
	'Classical',
	'Dance',
	'Techno',
	'Club',
	'Live',
	'Reggae',
	'Full Bass',
	'Full Treble',
	'Full Bass & Treble',
	'Large Hall',
	'Party',
	'Ska',
	'Soft',
	'Soft Rock',
	'Headphones',
	'Laptop Speakers',
]

function buildBands(gains: Partial<Record<number, number>> = {}): EqualizerBand[] {
	return FREQUENCIES.map((centerFrequency, index) => ({
		index,
		centerFrequency,
		gainDb: gains[index] ?? 0,
		frequencyLabel:
			centerFrequency >= 1000 ? `${centerFrequency / 1000} kHz` : `${centerFrequency} Hz`,
	}))
}

function buildPresets(): EqualizerPreset[] {
	return BUILT_IN_PRESET_NAMES.map((name) => ({
		name,
		gains: new Array(10).fill(0),
		type: 'built-in',
	}))
}

function mockEqualizer(overrides: Partial<ReturnType<typeof useEqualizer>> = {}) {
	const value = {
		isEnabled: true,
		bands: buildBands(),
		currentPreset: 'Flat',
		setEnabled: jest.fn().mockResolvedValue(true),
		setBandGain: jest.fn().mockResolvedValue(true),
		setAllBandGains: jest.fn().mockResolvedValue(true),
		reset: jest.fn().mockResolvedValue(undefined),
		isLoading: false,
		gainRange: { min: -12, max: 12 },
		...overrides,
	}

	jest.mocked(useEqualizer).mockReturnValue(value)

	return value
}

function mockPresets(overrides: Partial<ReturnType<typeof useEqualizerPresets>> = {}) {
	const value = {
		presets: buildPresets(),
		builtInPresets: buildPresets(),
		customPresets: [],
		applyPreset: jest.fn().mockResolvedValue(true),
		saveCustomPreset: jest.fn().mockResolvedValue(true),
		deleteCustomPreset: jest.fn().mockResolvedValue(true),
		currentPreset: 'Flat' as string | null,
		isLoading: false,
		refreshPresets: jest.fn(),
	}

	jest.mocked(useEqualizerPresets).mockReturnValue({ ...value, ...overrides })

	return value
}

function renderScreen() {
	return render(
		<GestureHandlerRootView>
			<SafeAreaProvider
				initialMetrics={{
					frame: { x: 0, y: 0, width: 390, height: 844 },
					insets: { top: 0, left: 0, right: 0, bottom: 0 },
				}}
			>
				<TamaguiProvider config={config} defaultTheme='purple_dark'>
					<Theme name='purple_dark'>
						<EqualizerScreen />
					</Theme>
				</TamaguiProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>,
	)
}

describe('EqualizerScreen', () => {
	beforeEach(() => {
		jest.mocked(useIsCasting).mockReturnValue(false)
		mockEqualizer()
		mockPresets()
	})

	it('renders the enable toggle and ten band rows', () => {
		const { getByTestId, getAllByTestId, getByText } = renderScreen()

		expect(getByTestId('equalizer-enabled-switch')).toBeTruthy()
		expect(getAllByTestId(/equalizer-band-row-/)).toHaveLength(10)
		expect(getByText('31 Hz')).toBeTruthy()
		expect(getByText('16 kHz')).toBeTruthy()
	})

	it('renders formatted gain readouts', () => {
		mockEqualizer({ bands: buildBands({ 5: 3, 0: -2.5 }) })

		const { getByText, getAllByText } = renderScreen()

		expect(getByText('+3.0 dB')).toBeTruthy()
		expect(getByText('-2.5 dB')).toBeTruthy()
		expect(getAllByText('0 dB')).toHaveLength(8)
	})

	it('toggling the switch calls setEnabled', () => {
		const equalizer = mockEqualizer({ isEnabled: false })

		const { getByTestId } = renderScreen()

		fireEvent(getByTestId('equalizer-enabled-switch'), 'checkedChange', true)

		expect(equalizer.setEnabled).toHaveBeenCalledWith(true)
	})

	it('renders a chip per built-in preset and applies on press', () => {
		const presets = mockPresets()

		const { getAllByTestId, getByText } = renderScreen()

		expect(getAllByTestId(/equalizer-preset-/)).toHaveLength(BUILT_IN_PRESET_NAMES.length)

		fireEvent.press(getByText('Rock'))

		expect(presets.applyPreset).toHaveBeenCalledWith('Rock')
	})

	it('shows Custom when no preset is active', () => {
		mockEqualizer({ currentPreset: null })
		mockPresets({ currentPreset: null })

		const { getByText } = renderScreen()

		expect(getByText('Current: Custom')).toBeTruthy()
	})

	it('reset button calls reset', () => {
		const equalizer = mockEqualizer()

		const { getByTestId } = renderScreen()

		fireEvent.press(getByTestId('equalizer-reset-button'))

		expect(equalizer.reset).toHaveBeenCalled()
	})

	it('shows the cast hint only while casting', () => {
		const { queryByTestId, unmount } = renderScreen()

		expect(queryByTestId('equalizer-cast-hint')).toBeNull()

		unmount()

		jest.mocked(useIsCasting).mockReturnValue(true)

		const { getByTestId } = renderScreen()

		expect(getByTestId('equalizer-cast-hint')).toBeTruthy()
	})

	it('dims and blocks the sections when disabled', () => {
		mockEqualizer({ isEnabled: false })

		const { getByTestId } = renderScreen()

		const sections = getByTestId('equalizer-sections')

		expect(sections).toHaveStyle({ opacity: 0.5 })

		const flattened = StyleSheet.flatten(sections.props.style)
		expect(sections.props.pointerEvents ?? flattened?.pointerEvents).toBe('none')
	})
})
