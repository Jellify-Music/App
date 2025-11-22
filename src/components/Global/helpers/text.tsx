import React, { forwardRef } from 'react'
import { StyleProp, TextStyle } from 'react-native'
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
import { extractTextFromChildren, mergeFontFallbackStyle } from '../../../utils/font-fallback'

type WithChildren<T> = Omit<T, 'children'> & { children?: React.ReactNode }

interface LabelProps extends WithChildren<TamaguiTextProps> {
	htmlFor: string
	size: SizeTokens
}

const withFallbackStyle = (
	children: React.ReactNode,
	style?: StyleProp<TextStyle>,
): StyleProp<TextStyle> | undefined => {
	const textContent = extractTextFromChildren(children)
	return mergeFontFallbackStyle(textContent, style)
}

export function Label({ children, htmlFor, size, style, ...rest }: LabelProps): React.JSX.Element {
	return (
		<TamaguiLabel
			fontWeight={600}
			htmlFor={htmlFor}
			justifyContent='flex-end'
			size={size}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiLabel>
	)
}

export function H1({
	children,
	style,
	...rest
}: WithChildren<TamaguiTextProps>): React.JSX.Element {
	return (
		<TamaguiH1
			marginBottom={'$2'}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiH1>
	)
}

export function H2({
	children,
	style,
	...rest
}: WithChildren<TamaguiTextProps>): React.JSX.Element {
	return (
		<TamaguiH2
			marginVertical={'$0.75'}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiH2>
	)
}

export function H3({
	children,
	style,
	...rest
}: WithChildren<TamaguiTextProps>): React.JSX.Element {
	return (
		<TamaguiH3
			marginVertical={'$0.5'}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiH3>
	)
}

export function H4({
	children,
	style,
	...rest
}: WithChildren<TamaguiTextProps>): React.JSX.Element {
	return (
		<TamaguiH4
			marginVertical={'$0.25'}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiH4>
	)
}

export function H5({
	children,
	style,
	...rest
}: WithChildren<TamaguiTextProps>): React.JSX.Element {
	return (
		<TamaguiH5
			marginVertical={'$0.25'}
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</TamaguiH5>
	)
}

interface TextProps extends WithChildren<TamaguiTextProps> {
	bold?: boolean | undefined
}

export const Text = forwardRef<typeof Paragraph, TextProps>(function Text(
	{ bold, children, style, ...rest },
	ref,
): React.JSX.Element {
	return (
		<Paragraph
			ref={ref}
			fontWeight={bold ? '$6' : '$4'}
			fontSize='$4'
			lineHeight={'$1'}
			lineBreakMode='clip'
			userSelect='none'
			style={withFallbackStyle(children, style as StyleProp<TextStyle>)}
			{...rest}
		>
			{children}
		</Paragraph>
	)
})

export const AnimatedH5 = Animated.createAnimatedComponent(H5)
