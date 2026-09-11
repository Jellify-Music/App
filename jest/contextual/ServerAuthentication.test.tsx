import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/styling/tamagui'
import ServerAuthentication from '../../src/components/Login/server-authentication'

/**
 * Expectation-driven tests for the username / password sign in form.
 *
 * Jellyfin accounts can have no password, so the form must submit when the
 * password field was never touched. The Maestro login flow relies on this too:
 * it only types a username before tapping `sign_in_button`.
 */

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ navigate: mockNavigate }),
}))

const mockAuthenticateUserByName = jest.fn()

jest.mock('../../src/api/mutations/authentication', () => ({
	__esModule: true,
	default: () => ({ mutate: mockAuthenticateUserByName, isPending: false }),
}))

function renderServerAuthentication() {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<ServerAuthentication />
		</TamaguiProvider>,
	)
}

describe('ServerAuthentication', () => {
	beforeEach(() => jest.clearAllMocks())

	it('signs in with an empty password when only a username is entered', async () => {
		await renderServerAuthentication()

		await fireEvent.changeText(screen.getByTestId('username_input'), 'jellify')
		await fireEvent.press(screen.getByTestId('sign_in_button'))

		expect(mockAuthenticateUserByName).toHaveBeenCalledTimes(1)
		expect(mockAuthenticateUserByName).toHaveBeenCalledWith({
			username: 'jellify',
			password: '',
		})
	})

	it('does not attempt to sign in without a username', async () => {
		await renderServerAuthentication()

		await fireEvent.press(screen.getByTestId('sign_in_button'))

		await fireEvent.changeText(screen.getByTestId('username_input'), 'jellify')
		await fireEvent.changeText(screen.getByTestId('username_input'), '')
		await fireEvent.press(screen.getByTestId('sign_in_button'))

		expect(mockAuthenticateUserByName).not.toHaveBeenCalled()
	})
})
