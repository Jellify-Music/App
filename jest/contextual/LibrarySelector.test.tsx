import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import LibrarySelector from '../../src/components/LibrarySelector'
import { JellifyLibrary } from '../../src/types/JellifyLibrary'

/**
 * Selecting a music library is optional: "All Libraries" queries every music
 * library the user can access, and is what new users start with.
 */

let mockLibrary: JellifyLibrary | undefined

jest.mock('../../src/stores/auth', () => ({
	useJellifyLibrary: () => [mockLibrary, jest.fn()],
}))

// A stable result, like a cached query's, so the selector's effect on it runs once
const mockLibrariesQuery = {
	data: [
		{ Id: 'music-a', Name: 'Music', CollectionType: 'music' },
		{ Id: 'movies', Name: 'Movies', CollectionType: 'movies' },
		{ Id: 'music-b', Name: 'Audiobooks', CollectionType: 'music' },
	],
	isError: false,
	isPending: false,
	isSuccess: true,
}

jest.mock('../../src/api/queries/libraries', () => ({
	useLibraries: () => mockLibrariesQuery,
}))

const onLibrarySelected = jest.fn()

function renderLibrarySelector() {
	return render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<LibrarySelector
				onLibrarySelected={onLibrarySelected}
				onCancel={jest.fn()}
				primaryButtonText="Let's Go!"
				primaryButtonIcon='guitar-electric'
				cancelButtonText='Cancel'
				cancelButtonIcon='chevron-left'
			/>
		</TamaguiProvider>,
	)
}

describe('LibrarySelector', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockLibrary = undefined
	})

	it('lists all libraries alongside each music library', async () => {
		await renderLibrarySelector()

		expect(screen.getByText('All Libraries')).toBeTruthy()
		expect(screen.getByText('Music')).toBeTruthy()
		expect(screen.getByText('Audiobooks')).toBeTruthy()
		expect(screen.queryByText('Movies')).toBeNull()
	})

	it('selects all libraries when no library is set', async () => {
		await renderLibrarySelector()

		await fireEvent.press(screen.getByTestId('let_s_go_button'))

		expect(onLibrarySelected).toHaveBeenCalledWith(undefined)
	})

	it('passes along the music library the user picks', async () => {
		await renderLibrarySelector()

		await fireEvent.press(screen.getByText('Audiobooks'))
		await fireEvent.press(screen.getByTestId('let_s_go_button'))

		expect(onLibrarySelected).toHaveBeenCalledWith(
			expect.objectContaining({ Id: 'music-b', Name: 'Audiobooks' }),
		)
	})

	it('keeps the selected library selected', async () => {
		mockLibrary = { musicLibraryId: 'music-a', musicLibraryName: 'Music' }

		await renderLibrarySelector()

		await fireEvent.press(screen.getByTestId('let_s_go_button'))

		expect(onLibrarySelected).toHaveBeenCalledWith(expect.objectContaining({ Id: 'music-a' }))
	})
})
