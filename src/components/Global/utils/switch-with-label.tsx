import { StyleSheet } from 'react-native'
import { applyHapticFeedback } from '../../../utils/haptics'
import { SizeTokens, XStack, Switch, styled, Label } from 'tamagui'

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

// Use theme tokens so thumb colors follow the active color preset
const JellifySliderThumb = styled(Switch.Thumb, {
	borderColor: 'color',
	backgroundColor: 'color',
})

export function SwitchWithLabel(props: SwitchWithLabelProps) {
	const { label } = props
	const id = `switch-${props.size.toString()}-${props.checked ?? ''}}`

	const handleCheckedChange = (checked: boolean) => {
		applyHapticFeedback('info')
		props.onCheckedChange(checked)
	}

	return (
		<XStack alignItems='center' gap='3'>
			<Switch
				id={id}
				testID={props.testID}
				width={'4'}
				height={'1-5'}
				checked={props.checked}
				onCheckedChange={handleCheckedChange}
				activeStyle={styles.active}
				style={styles.background}
				backgroundColor={'borderColor'}
			>
				<JellifySliderThumb width={'1'} height={'1'} transition='quick' />
			</Switch>
			{label && (
				<Label fontSize={props.size} htmlFor={id}>
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
