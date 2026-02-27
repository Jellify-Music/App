import { GestureResponderEvent } from 'react-native'
import { Button as TamaguiButton, ButtonProps as TamaguiButtonProps } from 'tamagui'

interface ButtonProps extends TamaguiButtonProps {
	children?: Element | string | undefined
	onPress?: ((event: GestureResponderEvent) => void) | undefined
	disabled?: boolean | undefined
	danger?: boolean | undefined
}

export default function Button(props: ButtonProps): React.JSX.Element {
	const { marginVertical = '$2', pressStyle, ...restProps } = props

	return (
		<TamaguiButton
			opacity={props.disabled ? 0.5 : 1}
			animation={'quick'}
			marginVertical={marginVertical}
			pressStyle={{
				opacity: 0.7,
				...pressStyle,
			}}
			{...restProps}
		/>
	)
}
