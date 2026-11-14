import React from 'react'
import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import ServerLibrary from '../../src/components/Login/server-library'

/**
 * Onboarding skips library selection when the user has a single music library,
 * since there is nothing to filter by.
 */

const mockSetLibrary = jest.fn()
const mockNavigate = jest.fn()

jest.mock('../../src/stores/auth', () => ({
	useJellifyLibrary: () => [undefined, mockSetLibrary],
}))

jest.mock('../../src/screens/navigation', () => ({
	__esModule: true,
	default: { navigate: (...args: unknown[]) => mockNavigate(...args) },
}))

jest.mock('../../src/api/mutations/quickconnect', () => ({
	useInitiateQuickConnect: () => ({ reset: jest.fn() }),
}))

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ navigate: jest.fn() }),
}))

let mockLibrariesQuery: {
	data: { Id: string; Name: string; CollectionType: string }[] | undefined
	isError: boolean
	isPending: boolean
	isSuccess: boolean
}

jest.mock('../../src/api/queries/libraries', () => ({
	useLibraries: () => mockLibrariesQuery,
}))

function renderServerLibrary() {
	return render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<ServerLibrary />
		</TamaguiProvider>,
	)
}

describe('ServerLibrary', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('skips library selection with one music library', async () => {
		mockLibrariesQuery = {
			data: [{ Id: 'music-a', Name: 'Music', CollectionType: 'music' }],
			isError: false,
			isPending: false,
			isSuccess: true,
		}

		await renderServerLibrary()

		expect(mockSetLibrary).toHaveBeenCalledWith(undefined)
		expect(mockNavigate).toHaveBeenCalledWith('Tabs')
	})

	it('asks for a library with more than one music library', async () => {
		mockLibrariesQuery = {
			data: [
				{ Id: 'music-a', Name: 'Music', CollectionType: 'music' },
				{ Id: 'music-b', Name: 'Audiobooks', CollectionType: 'music' },
			],
			isError: false,
			isPending: false,
			isSuccess: true,
		}

		await renderServerLibrary()

		expect(mockNavigate).not.toHaveBeenCalled()
	})

	it('waits for the libraries to load before skipping', async () => {
		mockLibrariesQuery = {
			data: undefined,
			isError: false,
			isPending: true,
			isSuccess: false,
		}

		await renderServerLibrary()

		expect(mockNavigate).not.toHaveBeenCalled()
	})

	it('stays on library selection without music libraries', async () => {
		mockLibrariesQuery = {
			data: [],
			isError: false,
			isPending: false,
			isSuccess: true,
		}

		await renderServerLibrary()

		expect(mockNavigate).not.toHaveBeenCalled()
		expect(mockSetLibrary).not.toHaveBeenCalled()
	})
})
