import React, { useEffect, useRef, useState } from 'react'
import { YStack, XStack, SizableText, ScrollView, useTheme, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEqualizer, useEqualizerPresets, type EqualizerBand } from 'react-native-nitro-player'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/helpers/button'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import ActionChip from '../../components/Settings/components/sections/action-chip'
import { useIsCasting } from '../../stores/player/engine'
import {
	EQ_GAIN_MIN,
	EQ_SLIDER_MAX,
	dbToSliderValue,
	formatGainLabel,
	sliderValueToDb,
} from '../../utils/audio/equalizer'
import { captureWarning, LoggingContext } from '../../utils/logging'

export default function EqualizerScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const isCasting = useIsCasting()

	const { isEnabled, bands, setEnabled, setBandGain, reset, isLoading } = useEqualizer()

	const { builtInPresets, applyPreset, currentPreset } = useEqualizerPresets()

	/**
	 * The equalizer state restores natively while {@link useEqualizer} is
	 * loading, so gate the controls until then to keep an early gain commit
	 * from being clobbered by the initial state load.
	 */
	const sectionsDisabled = !isEnabled || isLoading

	const handleEnabledChange = async (enabled: boolean) => {
		if (!(await setEnabled(enabled)))
			captureWarning(LoggingContext.Equalizer, 'Failed to toggle equalizer')
	}

	const handleGainChange = async (bandIndex: number, gainDb: number) => {
		if (!(await setBandGain(bandIndex, gainDb)))
			captureWarning(LoggingContext.Equalizer, `Failed to set gain for band ${bandIndex}`)
	}

	const handleApplyPreset = async (name: string) => {
		if (!(await applyPreset(name)))
			captureWarning(LoggingContext.Equalizer, `Failed to apply preset ${name}`)
	}

	return (
		<YStack flex={1} backgroundColor='$background' testID='settings-screen-equalizer'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack
					padding='$4'
					gap='$4'
					borderColor={'$borderColor'}
					borderWidth={'$1'}
					borderRadius={'$4'}
					margin={'$2'}
				>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4' fontWeight='$6'>
								Enable Equalizer
							</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Adjust the gain of individual frequency bands
							</SizableText>
						</YStack>
						<SwitchWithLabel
							testID='equalizer-enabled-switch'
							checked={isEnabled}
							onCheckedChange={handleEnabledChange}
							size='$2'
						/>
					</XStack>

					{isCasting && (
						<XStack alignItems='center' gap='$2' testID='equalizer-cast-hint'>
							<Icon name='cast' color='$warning' small />
							<SizableText size='$2' color='$borderColor' flex={1}>
								The equalizer doesn&apos;t affect Google Cast playback
							</SizableText>
						</XStack>
					)}

					<YStack
						gap='$4'
						testID='equalizer-sections'
						opacity={sectionsDisabled ? 0.5 : 1}
						pointerEvents={sectionsDisabled ? 'none' : 'auto'}
					>
						<YStack gap='$3'>
							<YStack gap='$1'>
								<SizableText size='$4' fontWeight='$6'>
									Presets
								</SizableText>
								<SizableText size='$2' color='$borderColor'>
									{`Current: ${currentPreset ?? 'Custom'}`}
								</SizableText>
							</YStack>

							<XStack flexWrap='wrap' gap='$2'>
								{builtInPresets.map((preset) => (
									<ActionChip
										key={preset.name}
										testID={`equalizer-preset-${preset.name}`}
										label={preset.name}
										active={preset.name === currentPreset}
										onPress={() => handleApplyPreset(preset.name)}
									/>
								))}
							</XStack>
						</YStack>

						<YStack gap='$3'>
							<XStack alignItems='center' justifyContent='space-between'>
								<SizableText size='$4' fontWeight='$6'>
									Bands
								</SizableText>

								<Button
									testID='equalizer-reset-button'
									size='$3'
									backgroundColor='transparent'
									borderColor='$borderColor'
									borderWidth={1}
									onPress={reset}
									icon={<Icon name='backup-restore' color='$color' small />}
								>
									<SizableText size='$3'>Reset</SizableText>
								</Button>
							</XStack>

							{bands.map((band) => (
								<EqualizerBandRow
									key={band.index}
									band={band}
									onGainChange={handleGainChange}
								/>
							))}
						</YStack>
					</YStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}

interface EqualizerBandRowProps {
	band: EqualizerBand
	onGainChange: (bandIndex: number, gainDb: number) => void
}

function EqualizerBandRow({ band, onGainChange }: EqualizerBandRowProps): React.JSX.Element {
	const { primary, neutral } = useTheme()

	const gestureActive = useRef<boolean>(false)

	const sliderValue = useSharedValue(dbToSliderValue(band.gainDb))

	const [displayGainDb, setDisplayGainDb] = useState<number>(band.gainDb)

	/**
	 * Only update the readout from the slider while the user is dragging;
	 * external changes (presets, reset, native events) are synced below with
	 * their exact gains, which may sit between the slider's committed steps.
	 */
	const handleDisplayGainChange = (value: number) => {
		if (gestureActive.current) setDisplayGainDb(value + EQ_GAIN_MIN)
	}

	useAnimatedReaction(
		// 0.5 dB steps inline, as imported helpers aren't auto-workletized
		() => Math.round(sliderValue.value * 2) / 2,
		(current, previous) => {
			if (current !== previous) runOnJS(handleDisplayGainChange)(current)
		},
	)

	/**
	 * Sync the slider when the band changes externally. The gesture ref guard
	 * keeps an in-flight drag from being clobbered; a commit can't loop back
	 * through here because the slider only fires onValueChange from gestures
	 * and the committed gain is already rounded.
	 */
	useEffect(() => {
		if (!gestureActive.current) {
			sliderValue.value = dbToSliderValue(band.gainDb)
			setDisplayGainDb(band.gainDb)
		}
	}, [band.gainDb])

	const handleValueChange = (value: number) => {
		const gainDb = sliderValueToDb(value)

		// Snap the thumb to the committed step
		sliderValue.value = dbToSliderValue(gainDb)

		onGainChange(band.index, gainDb)
	}

	return (
		<XStack alignItems='center' gap='$3' testID={`equalizer-band-row-${band.index}`}>
			<SizableText size='$2' color='$borderColor' width={56}>
				{band.frequencyLabel}
			</SizableText>

			<YStack flex={1}>
				<Slider
					value={sliderValue}
					onValueChange={handleValueChange}
					maxValue={EQ_SLIDER_MAX}
					thumbWidth={8}
					color={primary.val}
					backgroundColor={neutral.val}
					thumbShadowColor={getTokenValue('$color.black')}
					trackHeight={getTokenValue('$2')}
					gestureActiveRef={gestureActive}
					hitSlop={8}
				/>
			</YStack>

			<SizableText
				size='$3'
				fontWeight='$6'
				fontVariant={['tabular-nums']}
				color='$borderColor'
				width={72}
				textAlign='right'
			>
				{formatGainLabel(displayGainDb)}
			</SizableText>
		</XStack>
	)
}
