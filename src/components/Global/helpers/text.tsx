import Animated from 'react-native-reanimated'
import {
	H1 as TamaguiH1,
	H2 as TamaguiH2,
	H3 as TamaguiH3,
	H4 as TamaguiH4,
	H5 as TamaguiH5,
	Label as TamaguiLabel,
	SizeTokens,
	Paragraph,
	TextProps as TamaguiTextProps,
} from 'tamagui'

interface LabelProps {
	htmlFor: string
	children: string
	size: SizeTokens
}

export function Label(props: LabelProps): React.JSX.Element {
	return (
		<TamaguiLabel fontWeight={600} htmlFor={props.htmlFor} justifyContent='flex-end'>
			{props.children}
		</TamaguiLabel>
	)
}

export function H1({ children }: { children: string }): React.JSX.Element {
	return <TamaguiH1 marginBottom={'$2'}>{children}</TamaguiH1>
}

export function H2(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH2 marginVertical={'$0.75'} {...props}>
			{props.children}
		</TamaguiH2>
	)
}

export function H3(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH3 marginVertical={'$0.5'} {...props}>
			{props.children}
		</TamaguiH3>
	)
}

export function H4(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH4 marginVertical={'$0.25'} {...props}>
			{props.children}
		</TamaguiH4>
	)
}

export function H5(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH5 {...props} marginVertical={'$0.25'}>
			{props.children}
		</TamaguiH5>
	)
}

interface TextProps extends TamaguiTextProps {
	bold?: boolean | undefined
	children: string
	textOutline?: 'none' | 'strong'
}

export function Text(props: TextProps): React.JSX.Element {
	return (
		<Paragraph
			{...props}
			/*
			 * Do not use Tamagui weight tokens ('$6', '$4', ...) for fontWeight.
			 *
			 * This app drives Tamagui animations with Reanimated
			 * (@tamagui/config/v5-reanimated), so styles on animated components are
			 * handed to Reanimated's processFontWeight, which accepts only real CSS
			 * weights (100-900) and the named aliases in FONT_WEIGHT_MAPPINGS.
			 * A weight token does not resolve against the font's weight scale here;
			 * it resolves against the space scale, where '$6' is 32 and '$4' is 18.
			 * Reanimated then throws "Invalid font weight value: 32". In debug that
			 * surfaces as a red box, but in a release build the uncaught exception
			 * kills the process on launch.
			 *
			 * Always use literal weight strings.
			 */
			fontWeight={props.bold ? '600' : '400'}
			fontSize='$4'
			lineHeight={'$1'}
			lineBreakMode='clip'
			userSelect='none'
			textShadowColor={props.textOutline === 'strong' ? 'rgba(0, 0, 0, 0.9)' : 'transparent'}
			textShadowOffset={
				props.textOutline === 'strong'
					? { width: 0.5, height: 0.5 }
					: { width: 0, height: 0 }
			}
			textShadowRadius={props.textOutline === 'strong' ? 2 : 0}
		>
			{props.children}
		</Paragraph>
	)
}

export const AnimatedH5 = Animated.createAnimatedComponent(H5)
