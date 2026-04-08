import React from 'react'
import { Platform, TextInputProps } from 'react-native'
import { Input as TamaguiInput, InputProps as TamaguiInputProps, XStack, YStack } from 'tamagui'
import Icon from '../components/icon'

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
		appendElement?: React.JSX.Element | undefined
	}

/**
 * On Android, `clearButtonMode` is iOS-only and produces no UI. We render a
 * manual clear button so Android users can wipe the input in one tap. iOS keeps
 * using the native control.
 *
 * Tracked by https://github.com/Jellify-Music/App/issues/652
 */
export default function Input(props: InputProps): React.JSX.Element {
	const {
		prependElement,
		appendElement,
		value,
		onChangeText,
		clearButtonMode,
		testID,
		...inputProps
	} = props

	const showAndroidClearButton =
		Platform.OS === 'android' &&
		!appendElement &&
		typeof value === 'string' &&
		value.length > 0 &&
		!!onChangeText

	/**
	 * Default `clearButtonMode` to `'always'` for the iOS native control, but
	 * let callers override (e.g. `'while-editing'`, `'never'`). When the caller
	 * has supplied an `appendElement` we default to `'never'` so iOS users
	 * don't see a double trailing control (native X + caller's element).
	 */
	const resolvedClearButtonMode = clearButtonMode ?? (appendElement ? 'never' : 'always')

	/**
	 * Derive the clear button's testID from the parent input so multiple Inputs
	 * on the same screen each get a unique selector for Maestro / E2E tests.
	 */
	const clearButtonTestID = testID ? `${testID}-clear` : 'input-clear-button'

	return (
		<XStack alignItems='center'>
			{prependElement && (
				<YStack flex={1} alignItems='center' justifyContent='center'>
					{prependElement}
				</YStack>
			)}

			<TamaguiInput
				flex={prependElement ? 8 : 1}
				value={value}
				onChangeText={onChangeText}
				testID={testID}
				clearButtonMode={resolvedClearButtonMode}
				{...inputProps}
			/>

			{appendElement && (
				<YStack alignItems='center' justifyContent='center' paddingLeft={'$2'}>
					{appendElement}
				</YStack>
			)}

			{showAndroidClearButton && (
				<YStack
					accessibilityRole='button'
					accessibilityLabel='Clear text'
					accessibilityHint='Clears the contents of the text field'
					onPress={() => onChangeText?.('')}
					testID={clearButtonTestID}
					alignItems='center'
					justifyContent='center'
					paddingLeft={'$2'}
					hitSlop={10}
				>
					<Icon small name='close-circle' color={'$neutral'} />
				</YStack>
			)}
		</XStack>
	)
}
