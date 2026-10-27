import { BUTTON_PRESS_STYLES, ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { GestureResponderEvent } from 'react-native'
import {
	Button as TamaguiButton,
	ButtonProps as TamaguiButtonProps,
	Spinner,
	SizableText,
} from 'tamagui'

interface ButtonProps extends Omit<TamaguiButtonProps, 'marginVertical'> {
	onPress?: ((event: GestureResponderEvent) => void) | undefined
	disabled?: boolean | undefined
	danger?: boolean | undefined
	pending?: boolean | undefined
}

export default function Button({ children, ...props }: ButtonProps): React.JSX.Element {
	const color = props.backgroundColor ? 'background' : (props.color ?? 'color')

	const animations = props.transition
		? {
				transition: props.transition,
				opacity: props.opacity,
				scale: props.scale,
			}
		: { ...BUTTON_PRESS_STYLES }

	// Icon press feedback is opacity-only, so pin the background to its resting value
	// to drop the skin's hover/press background shifts
	const interactionColors =
		props.opacity === ICON_PRESS_STYLES.opacity ? { backgroundColor: 'background' } : {}

	return (
		<TamaguiButton
			opacity={props.disabled ? 0.5 : 1}
			padding='1'
			borderRadius={props.circular ? undefined : '2'}
			{...animations}
			{...interactionColors}
			{...props}
		>
			{props.pending ? (
				<Spinner color='background' />
			) : (
				<SizableText color={color} fontSize='2' fontWeight='6'>
					{children}
				</SizableText>
			)}
		</TamaguiButton>
	)
}
