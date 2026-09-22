import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { artworkUri, collageArtworkUri } from '../../../src/services/android-auto/artwork'
import { getItemImageUrl } from '../../../src/api/queries/image/utils'

jest.mock('../../../src/api/queries/image/utils', () => ({
	getItemImageUrl: jest.fn(),
}))
jest.mock('react-native-device-info', () => ({
	getBundleId: () => 'com.cosmonautical.jellify.dev',
}))

const item: BaseItemDto = { Id: 'a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4', Name: 'Test' }

beforeEach(() => {
	jest.clearAllMocks()
})

describe('artworkUri', () => {
	it('builds a content:// URI carrying the id, type, tag and fallback letter', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Items/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Images/Primary?maxWidth=400&maxHeight=400&quality=90&format=Webp&tag=abc123',
		)

		expect(artworkUri(item)).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Primary?tag=abc123&letter=T',
		)
		expect(getItemImageUrl).toHaveBeenCalledWith(item, ImageType.Primary, {
			maxWidth: 400,
			maxHeight: 400,
		})
	})

	it('omits the tag when the Jellyfin URL has none', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Items/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Images/Backdrop?maxWidth=400&maxHeight=400',
		)

		expect(artworkUri(item, ImageType.Backdrop)).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Backdrop?letter=T',
		)
	})

	it('falls back to a letter placeholder when the Jellyfin URL path has an unexpected shape', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Something/Else',
		)

		expect(artworkUri(item)).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/placeholder?letter=T',
		)
	})

	it('falls back to a letter placeholder when getItemImageUrl has no URL for the item', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(undefined)

		expect(artworkUri({ Name: 'ábba', SortName: 'abba' })).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/placeholder?letter=A',
		)
	})

	it('encodes the # bucket for names that do not start with a letter', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(undefined)

		expect(artworkUri({ Name: '2Pac' })).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/placeholder?letter=%23',
		)
	})

	it('returns undefined for an undefined item without calling getItemImageUrl', () => {
		expect(artworkUri(undefined)).toBeUndefined()
		expect(getItemImageUrl).not.toHaveBeenCalled()
	})
})

describe('collageArtworkUri', () => {
	const artistWithArt = (n: number): BaseItemDto => ({
		Id: `${n}`.padStart(32, 'a'),
		Name: `Artist ${n}`,
	})

	it('combines up to 9 covers that have real artwork', () => {
		;(getItemImageUrl as jest.Mock).mockImplementation((item: BaseItemDto) =>
			item.Name === 'No art'
				? `https://jf/Items/${'f'.repeat(32)}/Images/Primary?maxWidth=400`
				: `https://jf/Items/${item.Id}/Images/Primary?tag=t${item.Id!.slice(-1)}`,
		)
		const items = [
			{ Id: 'f'.repeat(32), Name: 'No art' },
			...Array.from({ length: 10 }, (_, i) => artistWithArt(i)),
		]

		const uri = collageArtworkUri('A', items)

		const parts = new URL(uri.replace('content://', 'https://')).searchParams
			.get('items')!
			.split(',')
		expect(uri.startsWith('content://com.cosmonautical.jellify.dev.artwork/collage?')).toBe(
			true,
		)
		expect(parts).toHaveLength(9)
		expect(parts[0]).toBe(`${'0'.padStart(32, 'a')}.Primary.t0`)
		expect(uri).toContain('letter=A')
	})

	it('falls back to the letter tile when no item has artwork', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(undefined)

		expect(collageArtworkUri('#', [{ Id: 'x', Name: '2Pac' }])).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/placeholder?letter=%23',
		)
	})
})
