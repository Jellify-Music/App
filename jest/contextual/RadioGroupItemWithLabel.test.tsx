import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { RadioGroup, TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import { RadioGroupItemWithLabel } from '../../src/components/Global/helpers/radio-group-item-with-label'

describe('RadioGroupItemWithLabel', () => {
	it.each([
		['3', 18],
		['4', 22],
	] as const)('renders size %s as a visible circle', async (size, diameter) => {
		const screen = await render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<RadioGroup defaultValue='original'>
					<RadioGroupItemWithLabel size={size} value='original' label='Original' />
					<RadioGroupItemWithLabel size={size} value='high' label='High' />
				</RadioGroup>
			</TamaguiProvider>,
		)

		for (const radio of screen.getAllByRole('radio')) {
			expect(radio).toHaveStyle({
				width: diameter,
				height: diameter,
				flexShrink: 0,
				alignItems: 'center',
				justifyContent: 'center',
				borderTopLeftRadius: diameter / 2,
				borderTopRightRadius: diameter / 2,
				borderBottomLeftRadius: diameter / 2,
				borderBottomRightRadius: diameter / 2,
				borderTopWidth: 1,
				borderRightWidth: 1,
				borderBottomWidth: 1,
				borderLeftWidth: 1,
			})
		}
		expect(screen.getByRole('radio', { name: 'Original' })).toBeChecked()
		expect(screen.getByRole('radio', { name: 'High' })).not.toBeChecked()
	})

	it('changes selection by pressing the radio or its label', async () => {
		const onValueChange = jest.fn()
		const screen = await render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<RadioGroup defaultValue='original' onValueChange={onValueChange}>
					<RadioGroupItemWithLabel size='3' value='original' label='Original' />
					<RadioGroupItemWithLabel size='3' value='high' label='High' />
				</RadioGroup>
			</TamaguiProvider>,
		)

		await fireEvent.press(screen.getByRole('radio', { name: 'High' }))
		expect(onValueChange).toHaveBeenLastCalledWith('high')
		expect(screen.getByRole('radio', { name: 'High' })).toBeChecked()
		expect(screen.getByRole('radio', { name: 'Original' })).not.toBeChecked()

		await fireEvent.press(screen.getByText('Original'))
		expect(onValueChange).toHaveBeenLastCalledWith('original')
		expect(screen.getByRole('radio', { name: 'Original' })).toBeChecked()
	})

	it('keeps labels linked to their own group when values are repeated', async () => {
		const firstChange = jest.fn()
		const secondChange = jest.fn()
		const screen = await render(
			<TamaguiProvider config={config} defaultTheme='purple_dark'>
				<RadioGroup defaultValue='original' onValueChange={firstChange}>
					<RadioGroupItemWithLabel size='3' value='original' label='Stream original' />
					<RadioGroupItemWithLabel size='3' value='high' label='Stream high' />
				</RadioGroup>
				<RadioGroup defaultValue='original' onValueChange={secondChange}>
					<RadioGroupItemWithLabel size='3' value='original' label='Download original' />
					<RadioGroupItemWithLabel size='3' value='high' label='Download high' />
				</RadioGroup>
			</TamaguiProvider>,
		)

		await fireEvent.press(screen.getByText('Stream high'))
		expect(firstChange).toHaveBeenLastCalledWith('high')
		expect(secondChange).not.toHaveBeenCalled()
		expect(screen.getByRole('radio', { name: 'Stream high' })).toBeChecked()
		expect(screen.getByRole('radio', { name: 'Download original' })).toBeChecked()
	})
})
