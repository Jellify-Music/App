import React, { useCallback } from 'react'
import { Alert, ScrollView } from 'react-native'
import { Text, XStack, YStack, ZStack, useTheme, Spacer, View } from 'tamagui'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '../../../screens/Player/types'
import { useEqualizer, useEqualizerPresets } from 'react-native-nitro-player'
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { trigger } from 'react-native-haptic-feedback'
import BlurredBackground from './blurred-background'
import Icon from '../../Global/components/icon'

// ─── Animated Band Slider ────────────────────────────────────────────────────

const SLIDER_HEIGHT = 180
const KNOB_SIZE = 24

const BandSlider = React.memo(
	({
		bandIndex,
		gainDb,
		min,
		max,
		frequencyLabel,
		disabled,
		onGainChange,
		primaryColor,
		neutralColor,
		textColor,
	}: {
		bandIndex: number
		gainDb: number
		min: number
		max: number
		frequencyLabel: string
		disabled: boolean
		onGainChange: (bandIndex: number, gain: number) => void
		primaryColor: string
		neutralColor: string
		textColor: string
	}) => {
		const range = max - min
		const normalizedValue = (gainDb - min) / range
		const centerY = SLIDER_HEIGHT / 2

		const translateY = useSharedValue(0)
		const isActive = useSharedValue(false)

		const currentY = (1 - normalizedValue) * SLIDER_HEIGHT

		const knobStyle = useAnimatedStyle(() => {
			const baseY = (1 - (gainDb - min) / range) * SLIDER_HEIGHT
			return {
				transform: [
					{ translateY: baseY + translateY.value - KNOB_SIZE / 2 },
					{
						scale: withSpring(isActive.value ? 1.3 : 1, {
							damping: 15,
							stiffness: 200,
						}),
					},
				],
			}
		})

		const fillStyle = useAnimatedStyle(() => {
			const baseY = (1 - (gainDb - min) / range) * SLIDER_HEIGHT
			const knobCenter = baseY + translateY.value
			const top = Math.min(knobCenter, centerY)
			const height = Math.abs(knobCenter - centerY)
			return {
				position: 'absolute' as const,
				top,
				left: 6,
				right: 6,
				height,
				borderRadius: 4,
				backgroundColor: primaryColor,
				opacity: disabled ? 0.3 : 0.7,
			}
		})

		const glowStyle = useAnimatedStyle(() => ({
			opacity: withSpring(isActive.value ? 0.4 : 0, { damping: 15 }),
			transform: [
				{
					translateY:
						(1 - (gainDb - min) / range) * SLIDER_HEIGHT + translateY.value - 20,
				},
				{ scale: withSpring(isActive.value ? 1 : 0.5) },
			],
		}))

		const panGesture = Gesture.Pan()
			.enabled(!disabled)
			.onBegin(() => {
				isActive.value = true
			})
			.onUpdate((e) => {
				const clampedY = Math.max(
					-currentY,
					Math.min(SLIDER_HEIGHT - currentY, e.translationY),
				)
				translateY.value = clampedY
			})
			.onEnd((e) => {
				const finalY = currentY + e.translationY
				const clampedFinalY = Math.max(0, Math.min(SLIDER_HEIGHT, finalY))
				const newNormalized = 1 - clampedFinalY / SLIDER_HEIGHT
				const newGain = Math.round((min + newNormalized * range) * 2) / 2 // Snap to 0.5 dB
				translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
				isActive.value = false
				runOnJS(onGainChange)(bandIndex, Math.max(min, Math.min(max, newGain)))
			})
			.onFinalize(() => {
				translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
				isActive.value = false
			})

		return (
			<Animated.View
				entering={FadeInUp.delay(bandIndex * 40).springify()}
				style={{ alignItems: 'center', flex: 1 }}
			>
				{/* Gain label */}
				<Text
					fontSize={11}
					fontWeight='600'
					color={textColor}
					opacity={disabled ? 0.4 : 0.9}
					fontVariant={['tabular-nums']}
					marginBottom={6}
				>
					{gainDb > 0 ? '+' : ''}
					{gainDb.toFixed(1)}
				</Text>

				{/* Slider track */}
				<GestureDetector gesture={panGesture}>
					<View style={{ width: 36, height: SLIDER_HEIGHT }}>
						{/* Track background */}
						<View
							style={{
								position: 'absolute',
								left: 14,
								right: 14,
								top: 0,
								bottom: 0,
								borderRadius: 4,
								backgroundColor: neutralColor,
								opacity: disabled ? 0.15 : 0.2,
							}}
						/>

						{/* Center line */}
						<View
							style={{
								position: 'absolute',
								left: 6,
								right: 6,
								top: centerY - 0.5,
								height: 1,
								backgroundColor: neutralColor,
								opacity: 0.4,
							}}
						/>

						{/* Active fill */}
						<Animated.View style={fillStyle} />

						{/* Glow effect */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									left: -2,
									right: -2,
									height: 40,
									borderRadius: 20,
									backgroundColor: primaryColor,
								},
								glowStyle,
							]}
						/>

						{/* Knob */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									left: (36 - KNOB_SIZE) / 2,
									width: KNOB_SIZE,
									height: KNOB_SIZE,
									borderRadius: KNOB_SIZE / 2,
									backgroundColor: primaryColor,
									shadowColor: primaryColor,
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.6,
									shadowRadius: 8,
									elevation: 8,
								},
								knobStyle,
							]}
						/>
					</View>
				</GestureDetector>

				{/* Frequency label */}
				<Text
					fontSize={10}
					fontWeight='700'
					color={textColor}
					opacity={disabled ? 0.4 : 0.7}
					marginTop={8}
					textTransform='uppercase'
					letterSpacing={0.5}
				>
					{frequencyLabel}
				</Text>
			</Animated.View>
		)
	},
)

BandSlider.displayName = 'BandSlider'

// ─── Preset Chip ─────────────────────────────────────────────────────────────

const PresetChip = ({
	name,
	isActive,
	isCustom,
	disabled,
	onPress,
	onLongPress,
	primaryColor,
	borderColor,
	textColor,
}: {
	name: string
	isActive: boolean
	isCustom: boolean
	disabled: boolean
	onPress: () => void
	onLongPress?: () => void
	primaryColor: string
	borderColor: string
	textColor: string
}) => {
	return (
		<Animated.View
			style={{
				paddingHorizontal: 16,
				paddingVertical: 10,
				borderRadius: 20,
				borderWidth: 1,
				marginRight: 8,
				backgroundColor: isActive ? primaryColor : 'transparent',
				borderColor: isActive ? primaryColor : borderColor,
				opacity: disabled ? 0.4 : 1,
			}}
		>
			<Text
				fontSize={13}
				fontWeight={isActive ? '700' : '500'}
				color={isActive ? '#ffffff' : textColor}
				opacity={disabled ? 0.4 : 1}
				onPress={disabled ? undefined : onPress}
				onLongPress={disabled ? undefined : onLongPress}
			>
				{name}
			</Text>
		</Animated.View>
	)
}

PresetChip.displayName = 'PresetChip'

// ─── Toggle Switch ───────────────────────────────────────────────────────────

const AnimatedToggle = ({
	enabled,
	onToggle,
	primaryColor,
	neutralColor,
}: {
	enabled: boolean
	onToggle: (val: boolean) => void
	primaryColor: string
	neutralColor: string
}) => {
	const trackStyle = useAnimatedStyle(() => ({
		backgroundColor: withTiming(enabled ? primaryColor : neutralColor, { duration: 250 }),
	}))

	const thumbStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: withSpring(enabled ? 22 : 0, { damping: 15, stiffness: 250 }) },
			{ scale: withSpring(1, { damping: 15 }) },
		],
	}))

	return (
		<Animated.View
			style={[
				{
					width: 50,
					height: 28,
					borderRadius: 14,
					padding: 2,
					justifyContent: 'center',
				},
				trackStyle,
			]}
		>
			<Animated.View
				style={[
					{
						width: 24,
						height: 24,
						borderRadius: 12,
						backgroundColor: '#ffffff',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.2,
						shadowRadius: 4,
						elevation: 4,
					},
					thumbStyle,
				]}
			/>
			<View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
				onPress={() => {
					trigger('impactLight')
					onToggle(!enabled)
				}}
			/>
		</Animated.View>
	)
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EqualizerScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<PlayerParamList>
}): React.JSX.Element {
	const theme = useTheme()
	const { bottom } = useSafeAreaInsets()

	const primaryColor = theme.primary.val
	const neutralColor = theme.neutral.val
	const textColor = theme.color.val
	const borderColor = theme.neutral.val + '60'

	const {
		isEnabled,
		bands,
		currentPreset,
		setEnabled,
		setBandGain,
		reset,
		isLoading,
		gainRange,
	} = useEqualizer()

	const {
		presets,
		isLoading: presetsLoading,
		applyPreset,
		saveCustomPreset,
		deleteCustomPreset,
	} = useEqualizerPresets()

	const handleToggle = useCallback(
		(val: boolean) => {
			void setEnabled(val).then((success) => {
				if (!success && val) {
					Alert.alert(
						'Cannot Enable Equalizer',
						'Please load and play a track first before enabling the equalizer.',
					)
				}
			})
		},
		[setEnabled],
	)

	const handleBandGainChange = useCallback(
		(bandIndex: number, gain: number) => {
			void setBandGain(bandIndex, gain)
		},
		[setBandGain],
	)

	const handleSavePreset = useCallback(() => {
		Alert.prompt(
			'Save Preset',
			'Enter a name for your custom preset:',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Save',
					onPress: (name?: string) => {
						if (name) {
							void saveCustomPreset(name).then((success) => {
								if (!success) {
									Alert.alert('Error', 'Failed to save preset')
								}
							})
						}
					},
				},
			],
			'plain-text',
		)
	}, [saveCustomPreset])

	const handleDeletePreset = useCallback(
		(name: string) => {
			Alert.alert('Delete Preset', `Delete "${name}"?`, [
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => void deleteCustomPreset(name),
				},
			])
		},
		[deleteCustomPreset],
	)

	const hasNoBands = bands.length === 0

	return (
		<SafeAreaView style={{ flex: 1 }} edges={['top']}>
			<View flex={1}>
				<ZStack fullscreen>
					<BlurredBackground />

					<YStack fullscreen>
						{/* Header */}
						<Animated.View entering={FadeIn.duration(300)}>
							<XStack
								alignItems='center'
								justifyContent='space-between'
								paddingHorizontal='$4'
								paddingVertical='$2'
								marginTop='$2'
							>
								<XStack
									alignItems='center'
									onPress={() => {
										trigger('impactLight')
										navigation.goBack()
									}}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								>
									<Icon small name='chevron-left' />
								</XStack>

								<YStack alignItems='center'>
									<Text
										fontSize={17}
										fontWeight='700'
										color={textColor}
										letterSpacing={0.5}
									>
										Equalizer
									</Text>
								</YStack>

								<Spacer width={28} />
							</XStack>
						</Animated.View>

						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: 20,
								paddingBottom: bottom + 40,
							}}
						>
							{/* Warning Banner */}
							{hasNoBands && (
								<Animated.View entering={FadeInDown.springify()}>
									<XStack
										backgroundColor='$warning'
										opacity={0.15}
										borderRadius={12}
										padding='$3'
										marginTop='$3'
										alignItems='center'
										gap='$2'
									>
										<Text fontSize={14} color='$warning' fontWeight='600'>
											Play a track first to use the equalizer
										</Text>
									</XStack>
								</Animated.View>
							)}

							{/* Enable Toggle */}
							<Animated.View entering={FadeInDown.delay(80).springify()}>
								<XStack
									marginTop='$4'
									alignItems='center'
									justifyContent='space-between'
									backgroundColor={primaryColor + '10'}
									borderRadius={16}
									paddingHorizontal='$4'
									paddingVertical='$3.5'
									borderWidth={1}
									borderColor={isEnabled ? primaryColor + '40' : 'transparent'}
								>
									<YStack>
										<Text fontSize={16} fontWeight='700' color={textColor}>
											Equalizer
										</Text>
										<Text fontSize={12} color={neutralColor} marginTop={2}>
											{isEnabled ? 'Active' : 'Bypassed'}
										</Text>
									</YStack>
									<AnimatedToggle
										enabled={isEnabled}
										onToggle={handleToggle}
										primaryColor={primaryColor}
										neutralColor={neutralColor + '40'}
									/>
								</XStack>
							</Animated.View>

							{/* Presets */}
							<Animated.View entering={FadeInDown.delay(160).springify()}>
								<XStack
									marginTop='$4'
									alignItems='center'
									justifyContent='space-between'
								>
									<Text
										fontSize={14}
										fontWeight='700'
										color={textColor}
										opacity={0.8}
										textTransform='uppercase'
										letterSpacing={1.5}
									>
										Presets
									</Text>
									<Text
										fontSize={13}
										fontWeight='600'
										color={primaryColor}
										opacity={isEnabled ? 1 : 0.4}
										onPress={isEnabled ? handleSavePreset : undefined}
									>
										+ Save Custom
									</Text>
								</XStack>

								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									style={{ marginTop: 12 }}
									contentContainerStyle={{ paddingRight: 20 }}
								>
									{presets.map((preset) => (
										<PresetChip
											key={preset.name}
											name={preset.name}
											isActive={currentPreset === preset.name}
											isCustom={preset.type === 'custom'}
											disabled={!isEnabled}
											onPress={() => {
												trigger('impactLight')
												void applyPreset(preset.name)
											}}
											onLongPress={
												preset.type === 'custom'
													? () => handleDeletePreset(preset.name)
													: undefined
											}
											primaryColor={primaryColor}
											borderColor={borderColor}
											textColor={textColor}
										/>
									))}
								</ScrollView>

								<Text
									fontSize={11}
									color={neutralColor}
									marginTop={8}
									fontStyle='italic'
								>
									{isEnabled
										? 'Tap to apply \u00B7 Long press custom presets to delete'
										: 'Enable equalizer to select presets'}
								</Text>
							</Animated.View>

							{/* Bands */}
							<Animated.View entering={FadeInDown.delay(240).springify()}>
								<XStack
									marginTop='$4'
									alignItems='center'
									justifyContent='space-between'
								>
									<Text
										fontSize={14}
										fontWeight='700'
										color={textColor}
										opacity={0.8}
										textTransform='uppercase'
										letterSpacing={1.5}
									>
										Bands
									</Text>
									<Text
										fontSize={13}
										fontWeight='600'
										color={primaryColor}
										opacity={isEnabled ? 1 : 0.4}
										onPress={
											isEnabled
												? () => {
														trigger('impactLight')
														void reset()
													}
												: undefined
										}
									>
										Reset
									</Text>
								</XStack>

								{/* dB range labels */}
								<XStack
									justifyContent='space-between'
									marginTop='$3'
									paddingHorizontal={4}
								>
									<Text
										fontSize={10}
										color={neutralColor}
										fontVariant={['tabular-nums']}
									>
										+{gainRange.max}dB
									</Text>
									<Text fontSize={10} color={neutralColor}>
										0dB
									</Text>
									<Text
										fontSize={10}
										color={neutralColor}
										fontVariant={['tabular-nums']}
									>
										{gainRange.min}dB
									</Text>
								</XStack>

								{/* Band sliders */}
								<XStack
									marginTop='$2'
									justifyContent='space-between'
									paddingVertical='$2'
								>
									{bands.map((band) => (
										<BandSlider
											key={band.index}
											bandIndex={band.index}
											gainDb={band.gainDb}
											min={gainRange.min}
											max={gainRange.max}
											frequencyLabel={band.frequencyLabel}
											disabled={!isEnabled}
											onGainChange={handleBandGainChange}
											primaryColor={primaryColor}
											neutralColor={neutralColor}
											textColor={textColor}
										/>
									))}
								</XStack>
							</Animated.View>
						</ScrollView>
					</YStack>
				</ZStack>
			</View>
		</SafeAreaView>
	)
}
