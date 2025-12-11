import React from 'react'
import { XStack, View, useTheme } from 'tamagui'
import ExpressivePlayButton from './expressive-play-button'
import { RepeatMode } from 'react-native-track-player'
import {
	usePrevious,
	useSkip,
	useToggleRepeatMode,
	useToggleShuffle,
} from '../../../providers/Player/hooks/mutations'
import { useRepeatModeStoreValue, useShuffle } from '../../../stores/player/queue'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Pressable, StyleSheet } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

/**
 * M3 Expressive Controls
 *
 * Size hierarchy based on interaction frequency:
 * - Play/Pause: 80px organic blob (highest emphasis)
 * - Skip/Previous: 48px filled circles (medium emphasis)
 * - Shuffle/Repeat: 32px pill buttons (low emphasis)
 */

// Skip button - medium emphasis (48px filled circle)
function SkipButton({
	direction,
	onPress,
	testID,
}: {
	direction: 'next' | 'previous'
	onPress: () => void
	testID?: string
}): React.JSX.Element {
	const theme = useTheme()
	const trigger = useHapticFeedback()
	const scale = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const handlePressIn = () => {
		scale.value = withSpring(0.9, { damping: 15, stiffness: 400 })
		trigger('impactLight')
	}

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 15, stiffness: 400 })
	}

	return (
		<Pressable
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			onPress={onPress}
			testID={testID}
		>
			<Animated.View
				style={[
					styles.skipButton,
					{ backgroundColor: theme.primaryContainer?.val ?? theme.primary.val + '20' },
					animatedStyle,
				]}
			>
				<MaterialDesignIcons
					name={direction === 'next' ? 'skip-next' : 'skip-previous'}
					size={28}
					color={theme.primary.val}
				/>
			</Animated.View>
		</Pressable>
	)
}

// Toggle button - low emphasis (32px pill)
function TogglePillButton({
	icon,
	isActive,
	onPress,
}: {
	icon: 'shuffle' | 'repeat' | 'repeat-once'
	isActive: boolean
	onPress: () => void
}): React.JSX.Element {
	const theme = useTheme()
	const trigger = useHapticFeedback()
	const scale = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const handlePressIn = () => {
		scale.value = withSpring(0.88, { damping: 15, stiffness: 400 })
	}

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 15, stiffness: 400 })
	}

	const handlePress = () => {
		trigger(isActive ? 'impactLight' : 'notificationSuccess')
		onPress()
	}

	return (
		<Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
			<Animated.View
				style={[
					styles.pillButton,
					{
						backgroundColor: isActive ? theme.primary.val : 'transparent',
						borderColor: isActive ? theme.primary.val : theme.color.val + '40',
					},
					animatedStyle,
				]}
			>
				<MaterialDesignIcons
					name={icon}
					size={18}
					color={isActive ? theme.background.val : theme.color.val}
				/>
			</Animated.View>
		</Pressable>
	)
}

export default function Controls(): React.JSX.Element {
	const previous = usePrevious()
	const skip = useSkip()
	const repeatMode = useRepeatModeStoreValue()
	const toggleRepeatMode = useToggleRepeatMode()
	const shuffled = useShuffle()
	const { mutate: toggleShuffle } = useToggleShuffle()

	const repeatIcon = repeatMode === RepeatMode.Track ? 'repeat-once' : 'repeat'

	return (
		<XStack alignItems='center' justifyContent='center' gap='$4' paddingVertical='$2'>
			{/* Low emphasis: Shuffle (leftmost) */}
			<View style={styles.pillContainer}>
				<TogglePillButton
					icon='shuffle'
					isActive={shuffled}
					onPress={() => toggleShuffle(shuffled)}
				/>
			</View>

			{/* Medium emphasis: Previous */}
			<SkipButton direction='previous' onPress={previous} testID='previous-button-test-id' />

			{/* High emphasis: Play/Pause (hero button) */}
			<View style={styles.playButtonContainer}>
				<ExpressivePlayButton />
			</View>

			{/* Medium emphasis: Next */}
			<SkipButton
				direction='next'
				onPress={() => skip(undefined)}
				testID='skip-button-test-id'
			/>

			{/* Low emphasis: Repeat (rightmost) */}
			<View style={styles.pillContainer}>
				<TogglePillButton
					icon={repeatIcon}
					isActive={repeatMode !== RepeatMode.Off}
					onPress={() => toggleRepeatMode()}
				/>
			</View>
		</XStack>
	)
}

const styles = StyleSheet.create({
	pillContainer: {
		width: 40,
		alignItems: 'center',
	},
	pillButton: {
		width: 40,
		height: 32,
		borderRadius: 16,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	skipButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	playButtonContainer: {
		marginHorizontal: 8,
	},
})
