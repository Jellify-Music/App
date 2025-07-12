import { SizeTokens, XStack, RadioGroup } from 'tamagui'
import { Label } from './text'

interface RadioGroupItemWithLabelProps {
	size: SizeTokens
	value: string
	label: string
	onValueChange?: (value: string) => void
}

export function RadioGroupItemWithLabel(props: RadioGroupItemWithLabelProps) {
	const id = `radiogroup-${props.value}`

	const handleLabelPress = () => {
		props.onValueChange?.(props.value)
	}

	return (
		<XStack width={300} alignItems='center' space='$4'>
			<RadioGroup.Item value={props.value} id={id} size={props.size}>
				<RadioGroup.Indicator />
			</RadioGroup.Item>

			<Label size={props.size} htmlFor={id} onPress={handleLabelPress}>
				{props.label}
			</Label>
		</XStack>
	)
}
