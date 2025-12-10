import React from 'react'
import { State } from 'react-native-track-player'
import { Spinner, View, useTheme } from 'tamagui'
import { useTogglePlayback } from '../../../providers/Player/hooks/mutations'
import { usePlaybackState } from '../../../providers/Player/hooks/queries'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	interpolate,
	Extrapolation,
} from 'react-native-reanimated'
import { Pressable, StyleSheet } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

/**
 * M3 Expressive Play Button
 *
 * Features:
 * - Dramatically larger (80px) than other controls
 * - Organic "petal" shape with asymmetric border radii
 * - Shape morphing animation on state change
 * - Filled background with primary color
 * - Scale animation on press
 */

const BUTTON_SIZE = 84
const ICON_SIZE = 40

// Dramatic organic blob shape - very asymmetric for expressive feel
// Think: rounded square with one corner much rounder than others
const PETAL_SHAPE_PLAYING = {
	borderTopLeftRadius: 50, // Very round
	borderTopRightRadius: 28, // Sharper
	borderBottomLeftRadius: 28, // Sharper
	borderBottomRightRadius: 50, // Very round
}

// Inverted asymmetry when paused - creates noticeable morph
const PETAL_SHAPE_PAUSED = {
	borderTopLeftRadius: 28, // Sharper
	borderTopRightRadius: 50, // Very round
	borderBottomLeftRadius: 50, // Very round
	borderBottomRightRadius: 28, // Sharper
}

export default function ExpressivePlayButton(): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const state = usePlaybackState()
	const theme = useTheme()
	const trigger = useHapticFeedback()

	const isPlaying = state === State.Playing
	const isLoading = state === State.Buffering || state === State.Loading

	// Animation values
	const scale = useSharedValue(1)
	const morphProgress = useSharedValue(isPlaying ? 1 : 0)

	// Update morph progress when state changes
	React.useEffect(() => {
		morphProgress.value = withSpring(isPlaying ? 1 : 0, {
			damping: 15,
			stiffness: 150,
		})
	}, [isPlaying, morphProgress])

	const animatedContainerStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
			borderTopLeftRadius: interpolate(
				morphProgress.value,
				[0, 1],
				[PETAL_SHAPE_PAUSED.borderTopLeftRadius, PETAL_SHAPE_PLAYING.borderTopLeftRadius],
				Extrapolation.CLAMP,
			),
			borderTopRightRadius: interpolate(
				morphProgress.value,
				[0, 1],
				[PETAL_SHAPE_PAUSED.borderTopRightRadius, PETAL_SHAPE_PLAYING.borderTopRightRadius],
				Extrapolation.CLAMP,
			),
			borderBottomLeftRadius: interpolate(
				morphProgress.value,
				[0, 1],
				[
					PETAL_SHAPE_PAUSED.borderBottomLeftRadius,
					PETAL_SHAPE_PLAYING.borderBottomLeftRadius,
				],
				Extrapolation.CLAMP,
			),
			borderBottomRightRadius: interpolate(
				morphProgress.value,
				[0, 1],
				[
					PETAL_SHAPE_PAUSED.borderBottomRightRadius,
					PETAL_SHAPE_PLAYING.borderBottomRightRadius,
				],
				Extrapolation.CLAMP,
			),
		}
	})

	const handlePressIn = () => {
		scale.value = withSpring(0.92, { damping: 15, stiffness: 400 })
		trigger('impactMedium')
	}

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 15, stiffness: 400 })
	}

	const handlePress = async () => {
		trigger('impactLight')
		await togglePlayback()
	}

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<Animated.View
					style={[
						styles.button,
						{ backgroundColor: theme.primary.val },
						animatedContainerStyle,
					]}
				>
					<Spinner size='large' color={theme.background.val} />
				</Animated.View>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<Pressable
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onPress={handlePress}
				testID={isPlaying ? 'pause-button-test-id' : 'play-button-test-id'}
			>
				<Animated.View
					style={[
						styles.button,
						{ backgroundColor: theme.primary.val },
						animatedContainerStyle,
					]}
				>
					<MaterialDesignIcons
						name={isPlaying ? 'pause' : 'play'}
						size={ICON_SIZE}
						color={theme.background.val}
						style={isPlaying ? undefined : styles.playIconOffset}
					/>
				</Animated.View>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		// Shadow for depth
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 8,
	},
	playIconOffset: {
		// Play icon is visually off-center, nudge it right
		marginLeft: 4,
	},
})
