import React from 'react'
import { Square, SizableText, Circle, FontSizeTokens, getFontSize } from 'tamagui'
import Icon from '../components/icon'
import { BUTTON_PRESS_STYLES } from '../../../configs/styling/elements'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

interface IconButtonProps {
	onPress: () => Promise<void>
	name: MaterialDesignIconsIconName
	title?: string | undefined
	circular?: boolean | undefined
	size?: FontSizeTokens
	largeIcon?: boolean | undefined
	disabled?: boolean | undefined
	testID?: string | undefined
}

export default function IconButton({
	name,
	onPress,
	title,
	circular,
	testID,
	size,
	disabled,
}: IconButtonProps): React.JSX.Element {
	const Shape = circular ? Circle : Square

	return (
		<Shape
			{...BUTTON_PRESS_STYLES}
			size={size}
			alignContent='center'
			justifyContent='center'
			backgroundColor={'transparent'}
			borderWidth={4}
			borderColor='primary'
			padding='1'
			onPress={onPress}
			testID={testID ?? undefined}
		>
			<Icon
				size={getFontSize(size) + getFontSize('2')}
				name={name}
				disabled={disabled}
				color={'primary'}
			/>

			{title && (
				<SizableText textAlign='center' fontSize={'3'}>
					{title}
				</SizableText>
			)}
		</Shape>
	)
}
