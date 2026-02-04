import { SizeTokens, XStack, Separator, Switch, styled } from 'tamagui'
import { Label } from './text'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'

interface SwitchWithLabelProps {
	onCheckedChange: (value: boolean) => void
	size: SizeTokens
	checked: boolean
	label: string
	width?: number | undefined
}

// Use theme tokens so thumb colors follow the active color preset
const JellifySliderThumb = styled(Switch.Thumb, {
	borderColor: '$primary',
	backgroundColor: '$background',
})

export function SwitchWithLabel(props: SwitchWithLabelProps) {
	const id = `switch-${props.size.toString().slice(1)}-${props.checked ?? ''}}`

	const handleCheckedChange = (checked: boolean) => {
		triggerHaptic('impactMedium')
		props.onCheckedChange(checked)
	}

	return (
		<XStack alignItems='center' gap='$3'>
			<Switch
				id={id}
				size={props.size}
				checked={props.checked}
				onCheckedChange={handleCheckedChange}
				backgroundColor={props.checked ? '$success' : '$borderColor'}
				borderColor={'$borderColor'}
			>
				<JellifySliderThumb animation='bouncy' />
			</Switch>
			<Separator minHeight={20} vertical />
			<Label size={props.size} htmlFor={id}>
				{props.label}
			</Label>
		</XStack>
	)
}
