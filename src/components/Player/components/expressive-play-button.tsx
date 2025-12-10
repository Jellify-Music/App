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
 * M3 Expressive Play Button - Flower/Petal Shape
 *
 * Creates an organic blob by layering multiple rotated rounded rectangles
 * This creates a flower-petal / organic blob effect that's distinctly
 * different from a simple circle
 */

const BUTTON_SIZE = 88
const ICON_SIZE = 42

export default function ExpressivePlayButton(): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const state = usePlaybackState()
	const theme = useTheme()
	const trigger = useHapticFeedback()

	const isPlaying = state === State.Playing
	const isLoading = state === State.Buffering || state === State.Loading

	// Animation values
	const scale = useSharedValue(1)
	const rotation = useSharedValue(0)

	// Rotate shape slightly when playing for visual feedback
	React.useEffect(() => {
		rotation.value = withSpring(isPlaying ? 22.5 : 0, {
			damping: 15,
			stiffness: 100,
		})
	}, [isPlaying, rotation])

	// Animated style for scale and rotation
	const animatedContainerStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
	}))

	// Counter-rotate icon so it stays upright
	const animatedIconStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${-rotation.value}deg` }],
	}))

	const handlePressIn = () => {
		scale.value = withSpring(0.9, { damping: 15, stiffness: 400 })
		trigger('impactMedium')
	}

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 15, stiffness: 400 })
	}

	const handlePress = async () => {
		trigger('impactLight')
		await togglePlayback()
	}

	const renderShape = (children: React.ReactNode) => (
		<View style={styles.shapeContainer}>
			{/* Base layer - rotated rounded rectangle */}
			<View
				style={[
					styles.petal,
					{ backgroundColor: theme.primary.val, transform: [{ rotate: '0deg' }] },
				]}
			/>
			{/* Second layer - rotated 45° for flower effect */}
			<View
				style={[
					styles.petal,
					{ backgroundColor: theme.primary.val, transform: [{ rotate: '45deg' }] },
				]}
			/>
			{/* Content overlay */}
			<View style={styles.contentOverlay}>{children}</View>
		</View>
	)

	if (isLoading) {
		return (
			<View style={styles.container}>
				<Animated.View style={animatedContainerStyle}>
					{renderShape(<Spinner size='large' color={theme.background.val} />)}
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
				<Animated.View style={animatedContainerStyle}>
					{renderShape(
						<Animated.View style={animatedIconStyle}>
							<MaterialDesignIcons
								name={isPlaying ? 'pause' : 'play'}
								size={ICON_SIZE}
								color={theme.background.val}
								style={isPlaying ? undefined : styles.playIconOffset}
							/>
						</Animated.View>,
					)}
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
	shapeContainer: {
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	petal: {
		position: 'absolute',
		width: BUTTON_SIZE * 0.85,
		height: BUTTON_SIZE * 0.85,
		borderRadius: BUTTON_SIZE * 0.28, // Creates rounded rectangle
		// Shadow for depth
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	contentOverlay: {
		position: 'absolute',
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	playIconOffset: {
		// Play icon is visually off-center, nudge it right
		marginLeft: 5,
	},
})
