import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import LibrarySelector from '../../src/components/LibrarySelector'
import { JellifyLibrary } from '../../src/types/JellifyLibrary'

/**
 * Selecting a music library is optional: the selected library acts as a filter,
 * and with no library selected Jellify queries every music library the user can access.
 */

let mockLibrary: JellifyLibrary | undefined

jest.mock('../../src/stores/auth', () => ({
	useJellifyLibrary: () => [mockLibrary, jest.fn()],
}))

// The libraries query only returns music libraries
const musicLibraries = [
	{ Id: 'music-a', Name: 'Music', CollectionType: 'music' },
	{ Id: 'music-b', Name: 'Audiobooks', CollectionType: 'music' },
]

let mockLibrariesQuery: {
	data: typeof musicLibraries | undefined
	isError: boolean
	isPending: boolean
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
		mockLibrariesQuery = { data: musicLibraries, isError: false, isPending: false }
	})

	it('shows a spinner while the libraries load', async () => {
		mockLibrariesQuery = { data: undefined, isError: false, isPending: true }

		await renderLibrarySelector()

		expect(screen.getByTestId('library_selection_loading')).toBeTruthy()
		expect(screen.queryByText('No music libraries found')).toBeNull()
	})

	it('says when there are no music libraries', async () => {
		mockLibrariesQuery = { data: [], isError: false, isPending: false }

		await renderLibrarySelector()

		expect(screen.getByText('No music libraries found')).toBeTruthy()
	})

	it('explains how to clear the selected library', async () => {
		mockLibrary = { musicLibraryId: 'music-a', musicLibraryName: 'Music' }

		await renderLibrarySelector()

		expect(
			screen.getByText('Tap the selected library again to show music from all libraries'),
		).toBeTruthy()
	})

	it('leaves out the filter hint with one music library', async () => {
		mockLibrariesQuery = { data: musicLibraries.slice(0, 1), isError: false, isPending: false }

		await renderLibrarySelector()

		expect(screen.queryByTestId('library_filter_hint')).toBeNull()
	})

	it('lists each music library', async () => {
		await renderLibrarySelector()

		expect(screen.queryByText('All Libraries')).toBeNull()
		expect(screen.getByText('Music')).toBeTruthy()
		expect(screen.getByText('Audiobooks')).toBeTruthy()
	})

	it('uses all libraries when no library is set', async () => {
		await renderLibrarySelector()

		expect(screen.getByText('Showing music from all libraries')).toBeTruthy()

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

	it('uses all libraries when the selected library is deselected', async () => {
		mockLibrary = { musicLibraryId: 'music-a', musicLibraryName: 'Music' }

		await renderLibrarySelector()

		await fireEvent.press(screen.getByText('Music'))
		await fireEvent.press(screen.getByTestId('let_s_go_button'))

		expect(onLibrarySelected).toHaveBeenCalledWith(undefined)
	})

	it('keeps the selected library selected', async () => {
		mockLibrary = { musicLibraryId: 'music-a', musicLibraryName: 'Music' }

		await renderLibrarySelector()

		await fireEvent.press(screen.getByTestId('let_s_go_button'))

		expect(onLibrarySelected).toHaveBeenCalledWith(expect.objectContaining({ Id: 'music-a' }))
	})
})
