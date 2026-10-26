import { BUTTON_PRESS_STYLES } from '../../../configs/styling/elements'
import { GestureResponderEvent } from 'react-native'
import { SizableText, Button as TamaguiButton, ButtonProps as TamaguiButtonProps } from 'tamagui'

interface ButtonProps extends Omit<TamaguiButtonProps, 'opacity' | 'marginVertical'> {
	onPress?: ((event: GestureResponderEvent) => void) | undefined
	disabled?: boolean | undefined
	danger?: boolean | undefined
}

export default function Button({ children, ...props }: ButtonProps): React.JSX.Element {
	return (
		<TamaguiButton
			{...props}
			opacity={props.disabled ? 0.5 : 1}
			padding='1'
			borderRadius={props.circular ? undefined : '2'}
			fontWeight='6'
			{...BUTTON_PRESS_STYLES}
		>
			<SizableText fontSize='2' fontWeight={'6'}>
				{children}
			</SizableText>
		</TamaguiButton>
	)
}
