import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import Button from '../../src/components/Global/helpers/button'

describe('Button', () => {
	it.each([
		[undefined, 38],
		['sm', 34],
		['md', 38],
		['lg', 42],
	] as const)(
		'renders a circular button at size %s with equal dimensions and a full radius',
		async (size, diameter) => {
			const onPress = jest.fn()
			const screen = await render(
				<TamaguiProvider config={config} defaultTheme='purple_dark'>
					<Button circular size={size} onPress={onPress} accessibilityLabel='Submit' />
				</TamaguiProvider>,
			)

			const button = screen.getByRole('button', { name: 'Submit' })
			const style = StyleSheet.flatten(button.props.style)

			expect(style.width).toBe(diameter)
			expect(style.height).toBe(diameter)
			for (const radius of [
				style.borderTopLeftRadius,
				style.borderTopRightRadius,
				style.borderBottomLeftRadius,
				style.borderBottomRightRadius,
			]) {
				expect(radius).toBeGreaterThanOrEqual(style.width / 2)
			}

			await fireEvent.press(button)
			expect(onPress).toHaveBeenCalledTimes(1)
		},
	)

	it('preserves the default rounded corners for non-circular buttons', async () => {
		const screen = await render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<Button>Submit</Button>
			</TamaguiProvider>,
		)

		expect(screen.getByRole('button', { name: 'Submit' })).toHaveStyle({
			borderTopLeftRadius: 5,
			borderTopRightRadius: 5,
			borderBottomLeftRadius: 5,
			borderBottomRightRadius: 5,
		})
	})
})
