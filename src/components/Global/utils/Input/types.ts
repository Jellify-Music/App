import { TextInputProps } from 'react-native'
import { InputProps as TamaguiInputProps } from 'tamagui'
import type { InputRefObject } from '../../../../hooks/gestures/search'

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

/**
 * Props for the custom Input component, extending Tamagui's InputProps and React Native's TextInputProps subset.
 */
export type InputProps = Omit<TamaguiInputProps, 'size'> &
	RNTextInputAutofillSubset & {
		/**
		 * A ref to the underlying Tamagui input element.
		 */
		ref?: InputRefObject

		/**
		 * The title displayed above the input field.
		 */
		title?: string | undefined

		/**
		 * The testID used for testing purposes.
		 */
		testID?: string | undefined

		/**
		 * The element displayed before the input field.
		 */
		prependElement?: React.JSX.Element | undefined

		/**
		 * The element displayed after the input field.
		 */
		appendElement?: React.JSX.Element | undefined
	}
