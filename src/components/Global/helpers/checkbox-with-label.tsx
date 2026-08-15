import React from 'react'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { CheckboxProps, XStack, Checkbox, Label, useTheme } from 'tamagui'

export function CheckboxWithLabel({
	size,
	label = 'Toggle',
	id,
	...checkboxProps
}: CheckboxProps & { label?: string; id?: string }) {
	const theme = useTheme()
	const checkboxId = id || `checkbox-${(size || '').toString().slice(1)}`
	return (
		<XStack width={150} alignItems='center' gap='$4'>
			<Checkbox id={checkboxId} size={size} {...checkboxProps}>
				<Checkbox.Indicator>
					<MaterialDesignIcons name='check' />
				</Checkbox.Indicator>
			</Checkbox>

			<Label
				color={checkboxProps.disabled ? '$borderColor' : theme.primary.val}
				size={size}
				htmlFor={checkboxId}
			>
				{label}
			</Label>
		</XStack>
	)
}
