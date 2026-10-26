import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import Input from '../../src/components/Global/helpers/input'

describe('Input', () => {
	// Android's TextInput crashes on launch when fontSize reaches it as a
	// string, so Tamagui's named size keys must resolve against our font.
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
