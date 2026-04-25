import { SizeTokens, XStack, Separator, Switch, styled } from 'tamagui'
import { Label } from './text'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'

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
	borderColor: '$color',
	backgroundColor: '$color',
})

export function SwitchWithLabel(props: SwitchWithLabelProps) {
	const { label } = props
	const id = `switch-${props.size.toString().slice(1)}-${props.checked ?? ''}}`

	const handleCheckedChange = (checked: boolean) => {
		triggerHaptic('impactMedium')
		props.onCheckedChange(checked)
	}

	return (
		<XStack alignItems='center' gap='$3'>
			<Switch
				id={id}
				testID={props.testID}
				size={props.size}
				checked={props.checked}
				onCheckedChange={handleCheckedChange}
				backgroundColor={'$borderColor'}
				activeStyle={{
					backgroundColor: '$success',
				}}
				borderColor={'$borderColor'}
			>
				<JellifySliderThumb transition='bouncy' />
			</Switch>
			{label ? (
				<>
					<Separator minHeight={20} vertical borderColor={'$borderColor'} />
					<Label size={props.size} htmlFor={id}>
						{label}
					</Label>
				</>
			) : null}
		</XStack>
	)
}
