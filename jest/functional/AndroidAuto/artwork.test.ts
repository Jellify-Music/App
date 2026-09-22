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
	it('builds a content:// URI carrying the id, type and tag', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Items/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Images/Primary?maxWidth=400&maxHeight=400&quality=90&format=Webp&tag=abc123',
		)

		expect(artworkUri(item)).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Primary?tag=abc123',
		)
		expect(getItemImageUrl).toHaveBeenCalledWith(item, ImageType.Primary, {
			maxWidth: 400,
			maxHeight: 400,
		})
	})

	it('omits the query string when the Jellyfin URL has no tag', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Items/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Images/Backdrop?maxWidth=400&maxHeight=400',
		)

		expect(artworkUri(item, ImageType.Backdrop)).toBe(
			'content://com.cosmonautical.jellify.dev.artwork/a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4/Backdrop',
		)
	})

	it('returns undefined when the Jellyfin URL path does not match the expected shape', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(
			'https://jellyfin.example.com/Something/Else',
		)

		expect(artworkUri(item)).toBeUndefined()
	})

	it('returns undefined when getItemImageUrl has no URL for the item', () => {
		;(getItemImageUrl as jest.Mock).mockReturnValue(undefined)

		expect(artworkUri(item)).toBeUndefined()
	})

	it('returns undefined for an undefined item without calling getItemImageUrl', () => {
		expect(artworkUri(undefined)).toBeUndefined()
		expect(getItemImageUrl).not.toHaveBeenCalled()
	})
})
