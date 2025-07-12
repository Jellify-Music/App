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
	return (
		<TamaguiH1 fontWeight={900} marginBottom={10} fontFamily={'$heading'}>
			{children}
		</TamaguiH1>
	)
}

export function H2(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH2 fontWeight={800} marginVertical={7} {...props} fontFamily={'$heading'}>
			{props.children}
		</TamaguiH2>
	)
}

export function H3(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH3 fontWeight={800} marginVertical={5} {...props} fontFamily={'$heading'}>
			{props.children}
		</TamaguiH3>
	)
}

export function H4(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH4 fontWeight={800} marginVertical={3} {...props} fontFamily={'$heading'}>
			{props.children}
		</TamaguiH4>
	)
}

export function H5(props: TamaguiTextProps): React.JSX.Element {
	return (
		<TamaguiH5 {...props} fontWeight={800} marginVertical={2} fontFamily={'$heading'}>
			{props.children}
		</TamaguiH5>
	)
}

interface TextProps extends TamaguiTextProps {
	bold?: boolean | undefined
	children: string
}

export function Text(props: TextProps): React.JSX.Element {
	return (
		<Paragraph
			fontWeight={props.bold ? '$6' : '$4'}
			fontSize='$4'
			lineHeight={'$1'}
			lineBreakMode='clip'
			userSelect='none'
			{...props}
		>
			{props.children}
		</Paragraph>
	)
}

export const AnimatedH5 = Animated.createAnimatedComponent(H5)
