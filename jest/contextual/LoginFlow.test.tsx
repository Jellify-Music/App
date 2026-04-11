/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'

// ── Storage mock (needed for all Zustand stores) ────────────────────────────
jest.mock('../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

// ── Third-party mocks ───────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
	SafeAreaView: ({ children, ...props }: any) => {
		const { View } = require('react-native')
		return <View {...props}>{children}</View>
	},
}))

jest.mock('react-native-toast-message', () => ({
	__esModule: true,
	default: { show: jest.fn() },
}))

// ── Config mocks ────────────────────────────────────────────────────────────
jest.mock('../../src/configs/config', () => ({
	IS_MAESTRO_BUILD: false,
}))

jest.mock('../../src/constants/protocols', () => ({
	__esModule: true,
	default: 'https://',
	HTTP: 'http://',
}))

// ── Store mocks ─────────────────────────────────────────────────────────────
jest.mock('../../src/stores', () => ({
	useSignOut: jest.fn(() => jest.fn()),
	useJellifyServer: jest.fn(() => [
		{ url: 'https://test.example.com', name: 'Test Server', version: '10.9.0' },
		jest.fn(),
	]),
	useJellifyLibrary: jest.fn(() => [undefined, jest.fn()]),
}))

jest.mock('../../src/stores/settings/app', () => ({
	useSendMetricsSetting: jest.fn(() => [false, jest.fn()]),
}))

// ── Mutation mocks ──────────────────────────────────────────────────────────
const mockConnectToServer = jest.fn()
jest.mock('../../src/api/mutations/public-system-info', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		mutate: mockConnectToServer,
		isPending: false,
	})),
}))

const mockAuthenticateUserByName = jest.fn()
jest.mock('../../src/api/mutations/authentication', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		mutate: mockAuthenticateUserByName,
		isPending: false,
	})),
}))

// ── Component mocks ─────────────────────────────────────────────────────────
jest.mock('../../src/components/Global/components/library-selector', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: (props: any) => (
			<View testID='library-selector'>
				<Text>{props.primaryButtonText}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		H2: (props: any) => <RNText {...props} />,
		Text: (props: any) => <RNText {...props} />,
	}
})

jest.mock('../../src/components/Global/helpers/button', () => {
	const { TouchableOpacity, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ children, onPress, testID, disabled, ...props }: any) => (
			<TouchableOpacity
				onPress={onPress}
				testID={testID}
				disabled={disabled}
				accessibilityState={{ disabled }}
			>
				{typeof children === 'string' ? <Text>{children}</Text> : children}
			</TouchableOpacity>
		),
	}
})

jest.mock('../../src/components/Global/helpers/input', () => {
	const { TextInput } = require('react-native')
	return {
		__esModule: true,
		default: ({ testID, onChangeText, placeholder, ...props }: any) => (
			<TextInput testID={testID} onChangeText={onChangeText} placeholder={placeholder} />
		),
	}
})

jest.mock('../../src/components/Global/components/icon', () => ({
	__esModule: true,
	default: () => null,
}))

jest.mock('../../src/components/Global/helpers/switch-with-label', () => ({
	SwitchWithLabel: () => null,
}))

// ── Utility mocks ───────────────────────────────────────────────────────────
jest.mock('../../src/utils/sleep', () => ({
	sleepify: jest.fn(() => Promise.resolve()),
}))

jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn(() => ({
		navigate: jest.fn(),
		popTo: jest.fn(),
	})),
}))

// ── Imports (after mocks) ───────────────────────────────────────────────────
import ServerAddress from '../../src/screens/Login/server-address'
import ServerAuthentication from '../../src/screens/Login/server-authentication'
import ServerLibrary from '../../src/screens/Login/server-library'
import { useJellifyServer } from '../../src/stores'

// ── Helpers ─────────────────────────────────────────────────────────────────
function renderWithTheme(ui: React.ReactElement) {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>{ui}</Theme>
		</TamaguiProvider>,
	)
}

const mockNavigation = {
	navigate: jest.fn(),
	popTo: jest.fn(),
	push: jest.fn(),
	goBack: jest.fn(),
	setOptions: jest.fn(),
} as any

// ── Tests ───────────────────────────────────────────────────────────────────
describe('Login Flow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ── ServerAddress ───────────────────────────────────────────────────
	describe('ServerAddress', () => {
		it('renders with the server_address_screen testID', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			expect(getByTestId('server_address_screen')).toBeTruthy()
		})

		it('shows "Connect to Jellyfin" title', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			const title = getByTestId('server_address_title')
			expect(title).toBeTruthy()
			expect(title.props.children).toBe('Connect to Jellyfin')
		})

		it('has a server address input', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			expect(getByTestId('server_address_input')).toBeTruthy()
		})

		it('has a connect button', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			expect(getByTestId('connect_button')).toBeTruthy()
		})

		it('connect button is disabled when no server address is entered', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			const button = getByTestId('connect_button')
			expect(button.props.accessibilityState.disabled).toBe(true)
		})

		it('calls connectToServer mutation when Connect button is pressed with a server address', () => {
			const { getByTestId } = renderWithTheme(<ServerAddress navigation={mockNavigation} />)
			fireEvent.changeText(getByTestId('server_address_input'), 'demo.jellyfin.org')
			fireEvent.press(getByTestId('connect_button'))
			expect(mockConnectToServer).toHaveBeenCalledWith({
				serverAddress: 'demo.jellyfin.org',
				useHttps: true,
			})
		})
	})

	// ── ServerAuthentication ────────────────────────────────────────────
	describe('ServerAuthentication', () => {
		it('renders with the server_authentication_screen testID', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			expect(getByTestId('server_authentication_screen')).toBeTruthy()
		})

		it('shows the server name in the title when server is set', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			const title = getByTestId('server_authentication_title')
			expect(title.props.children).toBe('Sign in to Test Server')
		})

		it('shows fallback title when server is not set', () => {
			;(useJellifyServer as jest.Mock).mockReturnValueOnce([undefined, jest.fn()])

			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			const title = getByTestId('server_authentication_title')
			expect(title.props.children).toBe('Sign in to Jellyfin')
		})

		it('has a username input', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			expect(getByTestId('username_input')).toBeTruthy()
		})

		it('has a password input', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			expect(getByTestId('password_input')).toBeTruthy()
		})

		it('has a sign in button', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			expect(getByTestId('sign_in_button')).toBeTruthy()
		})

		it('sign in button is disabled when username is empty', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			const button = getByTestId('sign_in_button')
			expect(button.props.accessibilityState.disabled).toBe(true)
		})

		it('calls authenticateUserByName when Sign in is pressed with username', () => {
			const { getByTestId } = renderWithTheme(
				<ServerAuthentication navigation={mockNavigation} />,
			)
			fireEvent.changeText(getByTestId('username_input'), 'testuser')
			fireEvent.press(getByTestId('sign_in_button'))
			expect(mockAuthenticateUserByName).toHaveBeenCalledWith({
				username: 'testuser',
				password: undefined,
			})
		})
	})

	// ── ServerLibrary ───────────────────────────────────────────────────
	describe('ServerLibrary', () => {
		it('renders the LibrarySelector component', () => {
			const { getByTestId } = renderWithTheme(<ServerLibrary navigation={mockNavigation} />)
			expect(getByTestId('library-selector')).toBeTruthy()
		})
	})
})
