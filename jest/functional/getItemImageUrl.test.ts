import { getItemImageUrl, ImageUrlOptions } from '../../src/api/queries/image/utils/index'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getApi } from '../../src/stores'
import * as ImageApi from '@jellyfin/sdk/lib/utils/api'

jest.mock('../../src/stores')

// Mock the Jellyfin image API
jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getImageApi: jest.fn(() => ({
		getItemImageUrlById: jest.fn(),
	})),
}))

const mockGetItemImageUrlById = jest.fn()

describe('getItemImageUrl', () => {
	const mockApi = { basePath: 'http://localhost:8096' }

	beforeEach(() => {
		jest.clearAllMocks()
		;(getApi as jest.Mock).mockReturnValue(mockApi)
		mockGetItemImageUrlById.mockReturnValue('http://example.com/image.jpg')
		jest.mocked(ImageApi.getImageApi).mockReturnValue({
			getItemImageUrlById: mockGetItemImageUrlById,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
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
		it('should fall back to album image when item has no own image but has both AlbumId and tag', () => {
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

		it('should skip album fallback when AlbumPrimaryImageTag is missing and use artist fallback', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumId: 'album-1',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'Test Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			// Should skip album (no tag) and fall back to artist
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('artist-1', ImageType.Primary, {
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

	describe('fallback - generic parent image', () => {
		it('should fall back to ParentPrimaryImageItemId when no item/album image exists', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ParentPrimaryImageItemId: 'parent-1',
				ParentPrimaryImageTag: 'parent-tag',
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('parent-1', ImageType.Primary, {
				tag: 'parent-tag',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should fall back to ParentId when ParentPrimaryImageItemId is not set', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ParentId: 'parent-1',
				ParentPrimaryImageTag: 'parent-tag',
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('parent-1', ImageType.Primary, {
				tag: 'parent-tag',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})
	})

	describe('fallback - artist own backdrop', () => {
		it('should use artist backdrop when requesting Primary and artist has no primary image', () => {
			const mockItem: BaseItemDto = {
				Id: 'artist-1',
				Name: 'Test Artist',
				Type: 'MusicArtist',
				BackdropImageTags: ['artist-backdrop-tag'],
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('artist-1', ImageType.Backdrop, {
				tag: 'artist-backdrop-tag',
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})
	})

	describe('fallback - item own ID', () => {
		it('should use item ID as last resort when no other fallback applies', () => {
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
		it('should handle different image types with their own tags', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Album',
				ImageTags: {
					[ImageType.Backdrop]: 'backdrop-tag',
					[ImageType.Primary]: 'primary-tag',
					[ImageType.Thumb]: 'thumb-tag',
				},
				Type: 'MusicAlbum',
			}

			// Request Primary type
			getItemImageUrl(mockItem, ImageType.Primary)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Primary,
				expect.objectContaining({
					tag: 'primary-tag',
				}),
			)

			// Clear mock
			mockGetItemImageUrlById.mockClear()

			// Request Thumb type (delegated to getItemBackdropUrl if Backdrop is requested)
			getItemImageUrl(mockItem, ImageType.Thumb)

			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Thumb,
				expect.objectContaining({
					tag: 'thumb-tag',
				}),
			)
		})

		it('should handle backdrop images via separate getItemBackdropUrl logic', () => {
			// Note: BackdropImageTags is an array, not a keyed object like ImageTags
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Album',
				BackdropImageTags: ['backdrop-tag-1', 'backdrop-tag-2'],
				ImageTags: {
					[ImageType.Primary]: 'primary-tag',
				},
				Type: 'MusicAlbum',
			}

			// Request Backdrop type - will use getItemBackdropUrl internally
			const result = getItemImageUrl(mockItem, ImageType.Backdrop)

			expect(result).toBe('http://example.com/image.jpg')
			// Backdrop fallback uses its own logic via getItemBackdropUrl
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'item-1',
				ImageType.Backdrop,
				expect.objectContaining({
					tag: 'backdrop-tag-1',
				}),
			)
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

		it('should prefer album with tag over artist even if artist exists', () => {
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

	describe('fallback - backdrop images', () => {
		it('should handle backdrop image type separately', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Album',
				BackdropImageTags: ['backdrop-tag-1'],
				Type: 'MusicAlbum',
			}

			const result = getItemImageUrl(mockItem, ImageType.Backdrop)

			expect(result).toBe('http://example.com/image.jpg')
			// Note: backdrop handling is delegated to getItemBackdropUrl
		})
	})

	describe('fallback - item own ID', () => {
		it('should use item ID as last resort when no image tags, album, or artists exist', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				Type: 'Audio',
				// No ImageTags, no AlbumId, no AlbumArtists, no ArtistItems
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})

		it('should use item ID as last resort after trying all fallbacks', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumId: 'album-1',
				// No AlbumPrimaryImageTag and no ArtistItems, so album and artist fallbacks won't trigger
				Type: 'Audio',
			}

			const result = getItemImageUrl(mockItem, ImageType.Primary)

			expect(result).toBe('http://example.com/image.jpg')
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith('item-1', ImageType.Primary, {
				tag: undefined,
				maxWidth: 200,
				maxHeight: 200,
				quality: 90,
			})
		})
	})

	describe('fallback - artist items', () => {
		it('should fall back to ArtistItems when no AlbumArtists exists', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ArtistItems: [
					{
						Id: 'artist-1',
						Name: 'Solo Artist',
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

		it('should prefer AlbumArtists over ArtistItems', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumArtists: [
					{
						Id: 'album-artist-1',
						Name: 'Album Artist',
					},
				],
				ArtistItems: [
					{
						Id: 'artist-1',
						Name: 'Solo Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			// Should use AlbumArtists, not ArtistItems
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'album-artist-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})

		it('should use only the first ArtistItem when multiple exist', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ArtistItems: [
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

		it('should skip ArtistItems without Id and fall back to item ID', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ArtistItems: [
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
	})

	describe('fallback order verification', () => {
		it('should follow the complete fallback order: own image → album → parent → artist → item ID', () => {
			// Test that artist fallback runs before item ID fallback
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			// Should use artist (preferred over item ID)
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'artist-1',
				ImageType.Primary,
				expect.any(Object),
			)
		})

		it('should verify parent image fallback is tried before artist fallback', () => {
			const mockItem: BaseItemDto = {
				Id: 'item-1',
				Name: 'Test Track',
				ParentId: 'parent-1',
				ParentPrimaryImageTag: 'parent-tag',
				AlbumArtists: [
					{
						Id: 'artist-1',
						Name: 'Artist',
					},
				],
				Type: 'Audio',
			}

			getItemImageUrl(mockItem, ImageType.Primary)

			// Should use parent (preferred over artist)
			expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
				'parent-1',
				ImageType.Primary,
				expect.objectContaining({ tag: 'parent-tag' }),
			)
		})
	})
})
