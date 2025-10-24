import React from 'react'
import { TextInputProps } from 'react-native'
import { Input as TamaguiInput, InputProps as TamaguiInputProps, XStack, YStack } from 'tamagui'

type RNTextInputAutofillSubset = Partial<
	Pick<
		TextInputProps,
		| 'autoComplete'
		| 'textContentType'
		| 'importantForAutofill'
		| 'returnKeyType'
		| 'autoFocus'
		| 'keyboardType'
	>
>

type InputProps = TamaguiInputProps &
	RNTextInputAutofillSubset & {
		prependElement?: React.JSX.Element | undefined
	}

export default function Input(props: InputProps): React.JSX.Element {
	return (
		<XStack>
			{props.prependElement && (
				<YStack flex={1} alignItems='center' justifyContent='center'>
					{props.prependElement}
				</YStack>
			)}

			<TamaguiInput flex={props.prependElement ? 8 : 1} {...props} clearButtonMode='always' />
		</XStack>
	)
}
