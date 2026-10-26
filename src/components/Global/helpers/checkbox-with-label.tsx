import React from 'react'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { CheckboxProps, XStack, Checkbox, Label, useTheme, CheckboxSize } from 'tamagui'

type CheckboxWithLabelProps = CheckboxProps & {
	label: string
	size: CheckboxSize
}

export function CheckboxWithLabel({
	label = 'Toggle',
	testID,
	disabled,
	...props
}: CheckboxWithLabelProps) {
	const theme = useTheme()
	return (
		<XStack width={150} alignItems='center' gap='4'>
			<Checkbox {...props}>
				<Checkbox.Indicator>
					<MaterialDesignIcons name='check' />
				</Checkbox.Indicator>
			</Checkbox>

			<Label color={disabled ? 'borderColor' : theme.primary.val}>{label}</Label>
		</XStack>
	)
}
