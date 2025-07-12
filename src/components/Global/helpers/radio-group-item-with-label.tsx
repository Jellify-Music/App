import { SizeTokens, XStack, RadioGroup } from 'tamagui'
import { Label } from './text'

export function RadioGroupItemWithLabel(props: { size: SizeTokens; value: string; label: string }) {
	const id = `radiogroup-${props.value}`
	return (
		<XStack width={300} alignItems='center' space='$4'>
			<RadioGroup.Item value={props.value} id={id} size={props.size}>
				<RadioGroup.Indicator />
			</RadioGroup.Item>

			<Label size={props.size} htmlFor={id}>
				{props.label}
			</Label>
		</XStack>
	)
}
