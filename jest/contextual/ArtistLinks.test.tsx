import React from 'react'
import { Linking } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import ArtistLinks from '../../src/components/Artist/links'
import { parseMusicBrainzLinks } from '../../src/api/queries/artist-info/links'
import { CHVRCHES } from '../helpers/musicbrainz-relations'

const MBID = '6a93afbb-257f-4166-b389-9f2a1e5c5df8'

let mockFound: ReturnType<typeof parseMusicBrainzLinks> | undefined

jest.mock('../../src/api/queries/artist-info', () => ({
	useArtistLinks: () => ({ data: mockFound }),
}))

const renderLinks = (musicBrainzId: string | undefined) =>
	render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<ArtistLinks musicBrainzId={musicBrainzId} />
		</TamaguiProvider>,
	)

describe('artist links', () => {
	let openURL: jest.SpyInstance

	beforeEach(() => {
		mockFound = undefined
		openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
	})

	afterEach(() => openURL.mockRestore())

	it('shows MusicBrainz as soon as the server has said the ID, before the rest are found', async () => {
		const screen = await renderLinks(MBID)

		expect(screen.getByText('MusicBrainz')).toBeTruthy()
		expect(screen.queryByText('Wikipedia')).toBeNull()
	})

	it('shows what MusicBrainz has for CHVRCHES after it, in order, and opens each in the browser', async () => {
		mockFound = parseMusicBrainzLinks(CHVRCHES)

		const screen = await renderLinks(MBID)

		expect(
			['musicbrainz', 'wikipedia', 'youtube', 'bandsintown'].map(
				(kind) => screen.getByTestId(`artist-link-${kind}`).props['aria-label'],
			),
		).toEqual(['Open MusicBrainz', 'Open Wikipedia', 'Open YouTube', 'Open Bandsintown'])

		await fireEvent.press(screen.getByTestId('artist-link-musicbrainz'))
		expect(openURL).toHaveBeenLastCalledWith(`https://musicbrainz.org/artist/${MBID}`)

		await fireEvent.press(screen.getByTestId('artist-link-wikipedia'))
		expect(openURL).toHaveBeenLastCalledWith(
			'https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q5118436',
		)

		await fireEvent.press(screen.getByTestId('artist-link-youtube'))
		expect(openURL).toHaveBeenLastCalledWith(
			'https://www.youtube.com/channel/UCXCfOEJFMa40s-57zxw9MYw',
		)

		await fireEvent.press(screen.getByTestId('artist-link-bandsintown'))
		expect(openURL).toHaveBeenLastCalledWith('https://www.bandsintown.com/a/4888013')
	})

	it('shows nothing without a MusicBrainz ID', async () => {
		const screen = await renderLinks(undefined)

		expect(screen.queryByTestId('artist-links')).toBeNull()
	})
})
