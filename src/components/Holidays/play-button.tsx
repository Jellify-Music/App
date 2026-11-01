import React, { memo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { useTheme } from 'tamagui'
import { useNowPlaying } from 'react-native-nitro-player'
import { togglePlayback } from '../../player/controls/playback'
import useIsLightMode from '../../hooks/use-is-light-mode'
import { useHolidayTokens } from './hooks'

const BUTTON_SIZE = 78
const GROUP_WIDTH = 80
const GROUP_HEIGHT = 94

/**
 * Play / pause button from the Holidays design: a big ring with a golden bell fixture on top,
 * so it hangs like an ornament. Shares its behavior with the stock button.
 */
function HolidayPlayButton({ flex }: { flex?: number }): React.JSX.Element {
	const { currentState } = useNowPlaying()
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const isLight = useIsLightMode()

	const color = theme.primary.val
	const isPlaying = currentState === 'playing'

	return (
		<View style={[styles.group, flex !== undefined && { flex }]}>
			<View pointerEvents='none' style={[styles.arch, { borderColor: tokens.gold }]} />
			<View pointerEvents='none' style={[styles.cap, { backgroundColor: tokens.gold }]} />

			<Pressable
				testID='play-button-test-id'
				accessibilityRole='button'
				accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
				onPress={togglePlayback}
				disabled={currentState === 'buffering'}
				style={[
					styles.button,
					{
						borderColor: color,
						backgroundColor: isLight
							? 'rgba(179, 38, 30, 0.08)'
							: 'rgba(242, 85, 90, 0.14)',
					},
					!isPlaying && styles.playNudge,
				]}
			>
				{currentState === 'buffering' ? (
					<ActivityIndicator color={color} />
				) : isPlaying ? (
					<Svg width={30} height={32} viewBox='0 0 30 32'>
						<Rect x={4} y={3} width={8} height={26} rx={2.5} fill={color} />
						<Rect x={18} y={3} width={8} height={26} rx={2.5} fill={color} />
					</Svg>
				) : (
					<Svg width={30} height={32} viewBox='0 0 30 32'>
						<Path
							d='M2 2l26 14L2 30z'
							fill={color}
							stroke={color}
							strokeWidth={2}
							strokeLinejoin='round'
						/>
					</Svg>
				)}
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	group: {
		width: GROUP_WIDTH,
		height: GROUP_HEIGHT,
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	arch: {
		position: 'absolute',
		top: 0,
		left: 33,
		width: 14,
		height: 12,
		borderWidth: 2,
		borderBottomWidth: 0,
		borderTopLeftRadius: 7,
		borderTopRightRadius: 7,
	},
	cap: {
		position: 'absolute',
		top: 9,
		left: 28,
		width: 24,
		height: 9,
		borderTopLeftRadius: 3,
		borderTopRightRadius: 3,
		borderBottomLeftRadius: 2,
		borderBottomRightRadius: 2,
	},
	button: {
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		borderRadius: BUTTON_SIZE / 2,
		borderWidth: 3,
		alignItems: 'center',
		justifyContent: 'center',
	},
	// A triangle looks centered when nudged right by a few px (the design pads the left by 5)
	playNudge: {
		paddingLeft: 5,
	},
})

export default memo(HolidayPlayButton)
