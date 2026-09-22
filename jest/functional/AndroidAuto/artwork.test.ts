import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { artworkUri } from '../../../src/services/android-auto/artwork'
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
