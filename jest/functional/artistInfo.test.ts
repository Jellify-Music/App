import { fetchArtistInfo, toPlainText } from '../../src/api/queries/artist-info/utils'

const mockGetItems = jest.fn()
jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getLibraryApi: () => ({ getItems: mockGetItems }),
}))
jest.mock('../../src/stores/auth/utils', () => ({ getApi: () => ({}) }))

const artist = { Id: '1', Name: 'Wardruna' }
const serverReturns = (item: object | undefined) =>
	mockGetItems.mockResolvedValue({ data: { Items: item ? [item] : [] } })

describe('fetchArtistInfo', () => {
	beforeEach(() => jest.clearAllMocks())

	it('returns the trimmed biography and genres the server has', async () => {
		serverReturns({ Overview: ' Norse folk. ', Genres: ['Folk'] })
		expect(await fetchArtistInfo(artist)).toEqual({ bio: 'Norse folk.', genres: ['Folk'] })
	})

	it('asks for the overview and genres, which items do not include by default', async () => {
		serverReturns({ Overview: 'x' })
		await fetchArtistInfo(artist)
		expect(mockGetItems.mock.calls[0][0]).toMatchObject({
			ids: ['1'],
			fields: ['Overview', 'Genres'],
		})
	})

	it.each([[{ Genres: ['Folk'] }], [{ Overview: '   ' }], [{ Overview: '<br/>' }], [undefined]])(
		'is null without a biography (%j)',
		async (item) => {
			serverReturns(item)
			expect(await fetchArtistInfo(artist)).toBeNull()
		},
	)

	it('is null without an artist ID, without asking the server', async () => {
		expect(await fetchArtistInfo({})).toBeNull()
		expect(mockGetItems).not.toHaveBeenCalled()
	})
})

describe('toPlainText', () => {
	it('leaves plain text alone', () => {
		expect(toPlainText('Norse folk.\n\nFormed in 2003.')).toBe('Norse folk.\n\nFormed in 2003.')
	})

	it('turns line breaks and paragraphs into new lines and drops other tags', () => {
		expect(toPlainText('One<br/>Two<BR>Three <a href="x">link</a> <b>bold</b>')).toBe(
			'One\nTwo\nThree link bold',
		)
		expect(toPlainText('<p>A</p><p>B</p>')).toBe('A\n\nB')
	})

	it('decodes the common entities, ampersand last so it is not decoded twice', () => {
		expect(toPlainText('Rock &amp; Roll &quot;x&quot; it&#39;s &amp;lt;')).toBe(
			'Rock & Roll "x" it\'s &lt;',
		)
	})
})
