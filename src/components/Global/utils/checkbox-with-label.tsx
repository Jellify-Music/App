import React from 'react'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { CheckboxProps, XStack, Checkbox, Label, useTheme, getFontSize } from 'tamagui'

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
	const theme = useTheme()

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
					<MaterialDesignIcons
						color={theme.primary.val}
						name='check'
						size={getFontSize('4')}
					/>
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
