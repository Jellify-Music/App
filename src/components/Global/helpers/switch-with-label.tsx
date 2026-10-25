import { StyleSheet } from 'react-native'
import { applyHapticFeedback } from '../../../utils/haptics'
import { SizeTokens, XStack, Separator, Switch, styled, Label } from 'tamagui'

interface SwitchWithLabelProps {
	onCheckedChange: (value: boolean) => void
	size: SizeTokens
	checked: boolean
	/**
	 * Optional. When omitted (or empty), the separator and label are hidden so
	 * the switch can stand alone — callers that lay out their own labels (e.g.
	 * via a settings row) don't end up with a blank trailing label or extra
	 * spacing.
	 */
	label?: string
	width?: number | undefined
	testID?: string
}

// Switch no longer has a `size` variant in Tamagui v3 (Frame/Thumb are bare
// styled(View) with no size-based width/height), so the track and thumb
// render at 0x0 unless we size them explicitly ourselves.
const SWITCH_TRACK_HEIGHT_PX: Record<string, number> = {
	'1': 20,
	'2': 24,
	'3': 28,
	'4': 32,
	'5': 36,
	'6': 40,
	'7': 44,
	'8': 48,
	'9': 52,
	'10': 56,
}
const DEFAULT_TRACK_HEIGHT_PX = 24
const THUMB_INSET_PX = 2

// Use theme tokens so thumb colors follow the active color preset
const JellifySliderThumb = styled(Switch.Thumb, {
	borderColor: 'color',
	backgroundColor: 'color',
})

export function SwitchWithLabel(props: SwitchWithLabelProps) {
	const { label } = props
	const id = `switch-${props.size.toString()}-${props.checked ?? ''}}`

	const trackHeight = SWITCH_TRACK_HEIGHT_PX[props.size.toString()] ?? DEFAULT_TRACK_HEIGHT_PX
	const trackWidth = trackHeight * 1.8
	const thumbSize = trackHeight - THUMB_INSET_PX * 2

	const handleCheckedChange = (checked: boolean) => {
		applyHapticFeedback('info')
		props.onCheckedChange(checked)
	}

	return (
		<XStack alignItems='center' gap='3'>
			<Switch
				id={id}
				testID={props.testID}
				width={trackWidth}
				height={trackHeight}
				borderRadius={trackHeight / 2}
				padding={THUMB_INSET_PX}
				checked={props.checked}
				onCheckedChange={handleCheckedChange}
				activeStyle={styles.active}
				style={styles.background}
				backgroundColor={'borderColor'}
			>
				<JellifySliderThumb
					width={thumbSize}
					height={thumbSize}
					borderRadius={thumbSize / 2}
					transition='quick'
				/>
			</Switch>
			{label && (
				<Label size={props.size} htmlFor={id}>
					{label}
				</Label>
			)}
		</XStack>
	)
}

const styles = StyleSheet.create({
	active: {
		backgroundColor: 'success',
	},
	background: {
		borderColor: 'borderColor',
	},
})
