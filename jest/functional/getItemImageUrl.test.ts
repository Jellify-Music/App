import { getItemImageUrl, ImageUrlOptions } from '../../src/api/queries/image/utils/index'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getApi } from '../../src/stores'

jest.mock('../../src/stores')

// Mock the Jellyfin image API
const mockGetItemImageUrlById = jest.fn()
const mockGetImageApi = jest.fn(() => ({
	getItemImageUrlById: mockGetItemImageUrlById,
}))

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getImageApi: mockGetImageApi,
}))

describe('getItemImageUrl', () => {
	const mockApi = { basePath: 'http://localhost:8096' }

	beforeEach(() => {
		jest.clearAllMocks()
		;(getApi as jest.Mock).mockReturnValue(mockApi)
		mockGetItemImageUrlById.mockReturnValue('http://example.com/image.jpg')
	})

	describe('happy path - with own image', () => {
		it('should return item image URL when item has its own image', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'tag-123',
				},
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: 'tag-123',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should use custom options when provided', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'tag-123',
				},
				Type: 'Audio',
			}

			const options: ImageUrlOptions = {
				maxWidth: 300,
				maxHeight: 400,
				quality: 80,
			}

			getItemImageUrl(mockItem, ImageType.Primary, options)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: 'tag-123',
				maxWidth: 300,
				maxHeight: 400,
				quality: 80,
			})
		})

		it('should use partial custom options with defaults', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'tag-123',
				},
				Type: 'Audio',
			}

			const options: ImageUrlOptions = {
				maxWidth: 300,
			}

			getItemImageUrl(mockItem, ImageType.Primary, options)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: 'tag-123',
				maxWidth: 300,
				maxHeight: 200, // default
				quality: 90, // default
			})
		})
	})

	describe('fallback - album image', () => {
		it('should fall back to album image when item has no own image but has AlbumId', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumId: 'album-1',
				AlbumPrimaryImageTag: 'album-tag-456',
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('album-1', ImageType.Primary, {
				tag: 'album-tag-456',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should use undefined tag when album has no AlbumPrimaryImageTag', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumId: 'album-1',
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('album-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should prefer own image over album image', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'item-tag-123',
				},
				AlbumId: 'album-1',
				AlbumPrimaryImageTag: 'album-tag-456',
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})
	})

	describe('fallback - album artist image', () => {
		it('should fall back to first album artist image when no own or album image', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'Test Artist',
					},
				],
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('artist-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should ignore album artists without Id', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumArtists: [
					{
						Name: 'Artist without ID',
					},
				],
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			// Should fall back to item's own ID
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})

		it('should use only the first album artist when multiple exist', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'First Artist',
					},
					{
						Id: 'artist-2',
						Name: 'Second Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'artist-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})
	})

	describe('fallback - item own ID', () => {
		it('should use item ID as last resort', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'tag-123',
				},
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: 'tag-123',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})
	})

	describe('error cases', () => {
		it('should return undefined when no API is available', () => {
			;(getApi as jest.Mock).mockReturnValue(undefined)

			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBeUndefined()
			expect(mockGetItemImageUrlById).not.toHaveBeenCalled()
		})

		it('should return undefined when item has no Id and no AlbumId', () => {
			const mockItem: BaseItemDto = {
				Name: 'Test Track',
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBeUndefined()
		})

		it('should return undefined when item has empty AlbumArtists array and no own Id', () => {
			const mockItem: BaseItemDto = {
				AlbumArtists: [],
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBeUndefined()
		})

		it('should return undefined when AlbumArtists is undefined and no other fallback exists', () => {
			const mockItem: BaseItemDto = {
				AlbumArtists: undefined,
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBeUndefined()
		})
	})

	describe('edge cases', () => {
		it('should handle different image types', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Album',
				ImageTags: {
					[ImageType.Backdrop]: 'backdrop-tag',
					[ImageType.Primary]: 'primary-tag',
				},
				Type: 'MusicAlbum',
			}

			getItemImageUrl(mockItem, ImageType.Backdrop)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Backdrop,
				expect.objectContaining({
					tag: 'backdrop-tag',
				}),
			)
		})

		it('should not use ImageTag when requesting a different type than available', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {
					[ImageType.Primary]: 'tag-123',
				},
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Backdrop)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Backdrop, {
				tag: undefined, // Backdrop tag doesn't exist, so undefined
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should handle ImageTags as empty object', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ImageTags: {},
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should prefer album over artist even if artist exists', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumId: 'album-1',
				AlbumPrimaryImageTag: 'album-tag',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'album-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})
	})

	describe('default thumbnail size', () => {
		it('should use 200x200 as default thumbnail size', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should use 90 as default quality', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})
	})
})
