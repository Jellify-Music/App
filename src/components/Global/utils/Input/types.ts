import { TextInputProps } from 'react-native'
import { InputProps as TamaguiInputProps, TamaguiElement } from 'tamagui'

export type RNTextInputAutofillSubset = Partial<
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

export type InputProps = Exclude<TamaguiInputProps, 'size'> &
	RNTextInputAutofillSubset & {
		ref?: React.Ref<TamaguiElement> | undefined
		title?: string | undefined
		testID?: string | undefined
		prependElement?: React.JSX.Element | undefined
		appendElement?: React.JSX.Element | undefined
	}
