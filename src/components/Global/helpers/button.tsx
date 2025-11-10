import { Button as TamaguiButton, ButtonProps as TamaguiButtonProps } from 'tamagui'

interface ButtonProps extends TamaguiButtonProps {
	children?: Element | string | undefined
	onPress?: () => void | undefined
	disabled?: boolean | undefined
	danger?: boolean | undefined
}

export default function Button(props: ButtonProps): React.JSX.Element {
	return (
		<TamaguiButton
			opacity={props.disabled ? 0.5 : 1}
			animation={'quick'}
			pressStyle={{
				scale: 0.9,
			}}
			{...props}
			marginVertical={'$2'}
		/>
	)
}
