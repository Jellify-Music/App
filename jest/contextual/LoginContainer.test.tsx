import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { LoginContainer } from '../../src/providers/Login'

describe('LoginContainer', () => {
	it('renders its children', async () => {
		await render(
			<LoginContainer>
				<Text>Login content</Text>
			</LoginContainer>,
		)

		expect(screen.getByText('Login content')).toBeTruthy()
	})
})
