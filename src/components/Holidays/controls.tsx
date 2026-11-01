import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from 'tamagui'
import PlayPauseButton from '../Player/components/buttons'
import { useRepeatMode, useShuffle } from '../../stores/player/queue'
import { toggleRepeatMode } from '../../player/controls/repeat-mode'
import { toggleShuffle } from '../../player/controls/shuffle'
import { previous, skip } from '../../player/controls'
import { NextIcon, PreviousIcon, RepeatIcon, ShuffleIcon } from './player-icons'

/**
 * Transport row from the Holidays design. Same actions as the stock controls, laid out on the
 * design's boxes: 48px shuffle / repeat, 52px previous / next, a 28px gap either side of the
 * play button.
 */
function HolidayControls(): React.JSX.Element {
	const theme = useTheme()
	const repeatMode = useRepeatMode()
	const shuffled = useShuffle()

	const repeatColor = repeatMode === 'off' ? theme.color.val : theme.primary.val

	return (
		<View style={styles.row}>
			<Pressable
				accessibilityRole='button'
				accessibilityLabel='Shuffle'
				onPress={async () => await toggleShuffle()}
				style={styles.small}
			>
				<ShuffleIcon color={shuffled ? theme.primary.val : theme.color.val} />
			</Pressable>

			<View style={styles.transport}>
				<Pressable
					testID='previous-button-test-id'
					accessibilityRole='button'
					accessibilityLabel='Previous'
					onPress={async () => await previous()}
					style={styles.large}
				>
					<PreviousIcon color={theme.primary.val} />
				</Pressable>

				<PlayPauseButton />

				<Pressable
					testID='skip-button-test-id'
					accessibilityRole='button'
					accessibilityLabel='Next'
					onPress={async () => await skip(undefined)}
					style={styles.large}
				>
					<NextIcon color={theme.primary.val} />
				</Pressable>
			</View>

			<Pressable
				accessibilityRole='button'
				accessibilityLabel='Repeat'
				onPress={toggleRepeatMode}
				style={styles.small}
			>
				<RepeatIcon color={repeatColor} />
				{repeatMode === 'track' && (
					<Text style={[styles.once, { color: repeatColor }]}>1</Text>
				)}
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		// The design's row runs 10px from the screen edges; the player content sits 18px in
		marginHorizontal: -8,
	},
	transport: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 28,
	},
	small: {
		width: 48,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	large: {
		width: 52,
		height: 52,
		alignItems: 'center',
		justifyContent: 'center',
	},
	once: {
		position: 'absolute',
		fontFamily: 'Figtree-Bold',
		fontSize: 9,
	},
})

export default memo(HolidayControls)
