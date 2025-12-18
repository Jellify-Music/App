import React, { useEffect } from 'react'
import { StyleSheet, Dimensions, View, ViewStyle } from 'react-native'
import Animated, {
	useSharedValue,
	withRepeat,
	withTiming,
	useAnimatedStyle,
	Easing,
	interpolate,
	withSequence,
} from 'react-native-reanimated'
import LinearGradient from 'react-native-linear-gradient'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { useSetupTheme } from '../context/ThemeContext'

const { width, height } = Dimensions.get('window')

// Vinyl Record Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VinylRecord: React.FC<{ style: any; color: string }> = ({ style, color }) => {
	return (
		<Animated.View style={[styles.vinyl, style]}>
			<LinearGradient
				colors={[color, `${color}CC`, `${color}80`]}
				style={styles.vinylGradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<View style={styles.vinylCenter} />
				<View style={[styles.vinylGroove, { top: '25%' }]} />
				<View style={[styles.vinylGroove, { top: '35%' }]} />
				<View style={[styles.vinylGroove, { top: '45%' }]} />
				<View style={[styles.vinylGroove, { top: '55%' }]} />
			</LinearGradient>
		</Animated.View>
	)
}

// Waveform bars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WaveformBars: React.FC<{ style: any; color: string }> = ({ style, color }) => {
	const bars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6]
	return (
		<Animated.View style={[styles.waveform, style]}>
			{bars.map((height, i) => (
				<View
					key={i}
					style={[
						styles.waveBar,
						{
							height: `${height * 100}%`,
							backgroundColor: color,
						},
					]}
				/>
			))}
		</Animated.View>
	)
}

export const SetupBackground = () => {
	const { isLight, themeKey } = useSetupTheme()

	// Animation values
	const vinyl1Rotate = useSharedValue(0)
	const vinyl2Rotate = useSharedValue(0)
	const noteFloat1 = useSharedValue(0)
	const noteFloat2 = useSharedValue(0)
	const waveScale1 = useSharedValue(1)

	console.log('🎨 Background rendering - Theme:', themeKey, 'isLight:', isLight)

	useEffect(() => {
		// Vinyl rotation animations - different speeds
		vinyl1Rotate.value = withRepeat(
			withTiming(360, { duration: 20000, easing: Easing.linear }),
			-1,
			false,
		)
		vinyl2Rotate.value = withRepeat(
			withTiming(-360, { duration: 25000, easing: Easing.linear }),
			-1,
			false,
		)

		// Floating notes
		noteFloat1.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
				withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
			),
			-1,
			false,
		)
		noteFloat2.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
				withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
			),
			-1,
			false,
		)

		// Waveform pulsing
		waveScale1.value = withRepeat(
			withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
			-1,
			false,
		)
	}, [])

	// Animated styles
	const vinyl1Style = useAnimatedStyle(() => ({
		transform: [{ rotate: `${vinyl1Rotate.value}deg` }],
	}))

	const vinyl2Style = useAnimatedStyle(() => ({
		transform: [{ rotate: `${vinyl2Rotate.value}deg` }],
	}))

	const note1Style = useAnimatedStyle(() => ({
		transform: [
			{ translateY: interpolate(noteFloat1.value, [0, 1], [0, -50]) },
			{ rotate: `${interpolate(noteFloat1.value, [0, 1], [0, 20])}deg` },
		],
		opacity: interpolate(noteFloat1.value, [0, 0.5, 1], [0.6, 1, 0.6]),
	}))

	const note2Style = useAnimatedStyle(() => ({
		transform: [
			{ translateY: interpolate(noteFloat2.value, [0, 1], [0, 60]) },
			{ rotate: `${interpolate(noteFloat2.value, [0, 1], [0, -25])}deg` },
		],
		opacity: interpolate(noteFloat2.value, [0, 0.5, 1], [0.5, 0.9, 0.5]),
	}))

	const wave1Style = useAnimatedStyle(() => ({
		transform: [{ scaleY: waveScale1.value }],
	}))

	// Theme-based colors - VERY LIGHT for light mode
	const baseColors = isLight
		? ['#FFFFFF', '#FCF7FF', '#F5EDFF'] // Pure white to very light purple
		: ['#1a0033', '#2d1b4e', '#1e0a3d'] // Deep purple/dark gradient

	const vinylColor1 = isLight ? '#D8B4FE' : '#C084FC' // Much lighter in light mode
	const vinylColor2 = isLight ? '#FBCFE8' : '#F472B6' // Much lighter pink
	const vinylColor3 = isLight ? '#BFDBFE' : '#60A5FA' // Much lighter blue

	const noteColor = isLight ? '#A855F7' : '#A78BFA' // Vibrant purple for light mode
	const waveColor = isLight ? '#C084FC' : '#C4B5FD' // Lighter wave color

	return (
		<>
			{/* Base gradient */}
			<LinearGradient
				colors={baseColors}
				style={StyleSheet.absoluteFill}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			/>

			{/* Large vinyl record - bottom left */}
			<VinylRecord
				style={[vinyl1Style, { position: 'absolute', bottom: -100, left: -100 }]}
				color={vinylColor1}
			/>

			{/* Medium vinyl record - top right */}
			<VinylRecord
				style={[
					vinyl2Style,
					{ position: 'absolute', top: -80, right: -80, width: 200, height: 200 },
				]}
				color={vinylColor2}
			/>

			{/* Floating music notes - reduced to 2 */}
			<Animated.View style={[note1Style, { position: 'absolute', top: '20%', right: '15%' }]}>
				<MaterialDesignIcon
					name='music-note'
					size={70}
					color={noteColor}
					style={{ opacity: 0.5 }}
				/>
			</Animated.View>

			<Animated.View
				style={[note2Style, { position: 'absolute', bottom: '25%', left: '15%' }]}
			>
				<MaterialDesignIcon
					name='music-note-eighth'
					size={80}
					color={noteColor}
					style={{ opacity: 0.45 }}
				/>
			</Animated.View>

			{/* Single waveform visualizer */}
			<WaveformBars
				style={[
					wave1Style,
					{
						position: 'absolute',
						top: '45%',
						left: '8%',
						opacity: isLight ? 0.25 : 0.35,
					},
				]}
				color={waveColor}
			/>

			{/* Overlay for readability - SUBTLE in light mode */}
			<LinearGradient
				colors={
					isLight
						? [
								'rgba(255,255,255,0.4)',
								'rgba(252,247,255,0.2)',
								'rgba(255,255,255,0.3)',
							]
						: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']
				}
				style={StyleSheet.absoluteFill}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				pointerEvents='none'
			/>
		</>
	)
}

const styles = StyleSheet.create({
	vinyl: {
		width: 280,
		height: 280,
		borderRadius: 140,
		overflow: 'hidden',
	},
	vinylGradient: {
		width: '100%',
		height: '100%',
		borderRadius: 140,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	vinylCenter: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(0,0,0,0.3)',
		position: 'absolute',
	},
	vinylGroove: {
		position: 'absolute',
		width: '90%',
		height: 1,
		backgroundColor: 'rgba(0,0,0,0.15)',
		left: '5%',
	},
	waveform: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 6,
		height: 80,
	},
	waveBar: {
		width: 6,
		borderRadius: 3,
		minHeight: 10,
	},
})
