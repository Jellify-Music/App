import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import Input from '../../src/components/Global/helpers/input'

describe('Input', () => {
	// Android's TextInput crashes on launch when fontSize reaches it as a
	// string. Tamagui's default Input size uses a named font key ('sm') that
	// our numeric-only font sizes don't define, so the helper sets its own.
	it('resolves its default font size to a number', async () => {
		const screen = await render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<Input testID='input' />
			</TamaguiProvider>,
		)

		const style = StyleSheet.flatten(screen.getByTestId('input').props.style)

		expect(typeof style.fontSize).toBe('number')
	})
})
