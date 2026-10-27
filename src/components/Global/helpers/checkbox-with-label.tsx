import React from 'react'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { CheckboxProps, XStack, Checkbox, Label } from 'tamagui'

type CheckboxWithLabelProps = CheckboxProps & {
	label: string
}

export function CheckboxWithLabel({
	label = 'Toggle',
	checked,
	onCheckedChange,
	disabled,
	...props
}: CheckboxWithLabelProps) {
	// Toggle directly rather than via htmlFor, which relies on Tamagui's
	// focusable registry and breaks when @tamagui/focusable is duplicated
	const handleLabelPress = () => {
		if (!disabled) onCheckedChange?.(checked !== true)
	}

	return (
		<XStack alignItems='center' gap='3'>
			<Checkbox
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
				{...props}
			>
				<Checkbox.Indicator>
					<MaterialDesignIcons name='check' />
				</Checkbox.Indicator>
			</Checkbox>

			<Label
				onPress={handleLabelPress}
				disabled={disabled}
				fontWeight='6'
				color={disabled ? 'borderColor' : 'primary'}
			>
				{label}
			</Label>
		</XStack>
	)
}
