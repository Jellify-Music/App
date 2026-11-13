import React, { useEffect, useRef, useState } from 'react'
import { YStack, XStack, SizableText, ScrollView, useTheme, getTokenValue, ZStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEqualizer, useEqualizerPresets, type EqualizerBand } from 'react-native-nitro-player'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Icon from '../Global/components/icon'
import { SwitchWithLabel } from '../Global/utils/switch-with-label'
import ActionChip from '../Settings/components/sections/action-chip'
import { useIsCasting } from '../../stores/player/engine'
import { dbToSliderValue, formatGainLabel, sliderValueToDb } from '../../utils/audio/equalizer'
import { captureWarning, LoggingContext } from '../../utils/logging'
import { applyHapticFeedback } from '../../utils/haptics'
import {
	EQ_GAIN_MIN,
	EQ_SLIDER_MAX,
	EQ_NOTCH_INTERVAL,
} from '../../configs/player/equalizer.config'

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

	const handleEnabledChange = (enabled: boolean) => {
		setEnabled(enabled).catch(() => {
			captureWarning(LoggingContext.Equalizer, 'Failed to toggle equalizer')
		})
	}

	const handleGainChange = (bandIndex: number, gainDb: number) => {
		setBandGain(bandIndex, gainDb).catch(() => {
			captureWarning(LoggingContext.Equalizer, `Failed to set gain for band ${bandIndex}`)
		})
	}

	const handleApplyPreset = (name: string) => {
		applyHapticFeedback('info')
		applyPreset(name).catch(() => {
			captureWarning(LoggingContext.Equalizer, `Failed to apply preset ${name}`)
		})
	}

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-equalizer'
		>
			<YStack gap='$4' margin={'$4'}>
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
						<Icon name='cast' color='warning' size='2' />
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
									icon={'check'}
								/>
							))}
						</XStack>
					</YStack>

					<YStack gap='3'>
						<XStack alignItems='center' justifyContent='space-between'>
							<SizableText size='$4' fontWeight='$6'>
								Bands
							</SizableText>

							<Icon
								name='backup-restore'
								color='warning'
								size='6'
								onPress={reset}
								testID='equalizer-reset-button'
							/>
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
	)
}

interface EqualizerBandRowProps {
	band: EqualizerBand
	onGainChange: (bandIndex: number, gainDb: number) => void
}

function EqualizerBandRow({ band, onGainChange }: EqualizerBandRowProps): React.JSX.Element {
	const { primary, neutral } = useTheme()

	const trackHeight = getTokenValue('2')

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
		applyHapticFeedback('info')

		const gainDb = sliderValueToDb(value)

		// Snap the thumb to the committed step
		sliderValue.value = dbToSliderValue(gainDb)

		onGainChange(band.index, gainDb)
	}

	return (
		<XStack alignItems='center' testID={`equalizer-band-row-${band.index}`}>
			<SizableText fontSize='3' color='$borderColor' width={'6'}>
				{band.frequencyLabel}
			</SizableText>

			<ZStack flex={1}>
				<SliderNotches thumbWidth={EQ_THUMB_WIDTH} trackHeight={trackHeight} />

				<Slider
					testID={`equalizer-band-slider-${band.index}`}
					value={sliderValue}
					onValueChange={handleValueChange}
					maxValue={EQ_SLIDER_MAX}
					thumbWidth={EQ_THUMB_WIDTH}
					color={primary.val}
					backgroundColor={neutral.val}
					thumbShadowColor={getTokenValue('black')}
					trackHeight={trackHeight}
					gestureActiveRef={gestureActive}
					hitSlop={8}
					step={0.5}
					stepAnimation={withTiming}
					stepResistance={0.7}
				/>
			</ZStack>

			<SizableText
				fontSize='3'
				fontWeight='6'
				fontVariant={['tabular-nums']}
				color='$borderColor'
				flexShrink={1}
				textAlign='right'
				width={'6'}
			>
				{formatGainLabel(displayGainDb)}
			</SizableText>
		</XStack>
	)
}

const EQ_THUMB_WIDTH = 8

const EQ_NOTCH_WIDTH = 1

const EQ_NOTCH_COUNT = EQ_SLIDER_MAX / EQ_NOTCH_INTERVAL + 1

interface SliderNotchesProps {
	thumbWidth: number
	trackHeight: number
}

/**
 * Draws notches behind a band slider at every {@link EQ_NOTCH_INTERVAL}.
 *
 * The slider travels its thumb's center from half a thumb in from either end,
 * so the notches are inset to match and spaced evenly between those points.
 */
function SliderNotches({ thumbWidth, trackHeight }: SliderNotchesProps): React.JSX.Element {
	return (
		<XStack
			position='absolute'
			top={0}
			bottom={0}
			left={0}
			right={0}
			alignItems='center'
			justifyContent='space-between'
			paddingHorizontal={(thumbWidth - EQ_NOTCH_WIDTH) / 2}
			pointerEvents='none'
		>
			{Array.from({ length: EQ_NOTCH_COUNT }, (_, index) => (
				<YStack
					key={index}
					width={EQ_NOTCH_WIDTH}
					height={trackHeight * 2}
					borderRadius={EQ_NOTCH_WIDTH / 2}
					backgroundColor='$borderColor'
				/>
			))}
		</XStack>
	)
}
