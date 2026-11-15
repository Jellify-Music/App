import { useId } from 'react'
import { SizeTokens, Token, XStack, RadioGroup, Label, getTokenValue } from 'tamagui'

interface RadioGroupItemWithLabelProps {
	size: SizeTokens & Token
	value: string
	label: string
}

export function RadioGroupItemWithLabel({ size, value, label }: RadioGroupItemWithLabelProps) {
	const id = useId()
	// Tamagui v3 radio sizes use named control sizes, not the numeric label tokens.
	const diameter = getTokenValue(size, 'size') / 2

	return (
		<XStack alignItems='center' gap='2' paddingVertical='1-5'>
			<RadioGroup.Item
				value={value}
				id={id}
				accessibilityLabel={label}
				width={diameter}
				height={diameter}
				flexShrink={0}
				alignItems='center'
				justifyContent='center'
				borderWidth={1}
				borderRadius={diameter / 2}
				activeTheme={null}
				backgroundColor='background'
				borderColor='borderColor'
			>
				<RadioGroup.Indicator
					width={diameter / 2}
					height={diameter / 2}
					borderRadius={diameter / 4}
					backgroundColor='primary'
				/>
			</RadioGroup.Item>

			<Label fontSize='2' fontWeight='6' size={size} htmlFor={id} flexShrink={1}>
				{label}
			</Label>
		</XStack>
	)
}
