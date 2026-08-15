import { getBlurhashFromDto } from '../../src/utils/parsing/blurhash'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { BaseItemDtoSlimified } from '../../src/types/JellifyTrack'

describe('getBlurhashFromDto', () => {
	describe('happy path', () => {
		it('should return blurhash value when ImageBlurHashes and type exist', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {
						'image-id-1': 'blurhash123',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toBe('blurhash123')
		})

		it('should return blurhash value for custom ImageType', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Backdrop]: {
						'backdrop-id': 'backdropblurhash456',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto, ImageType.Backdrop)

			expect(result).toBe('backdropblurhash456')
		})

		it('should return the first blurhash when multiple exist for same type', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {
						'image-id-1': 'blurhash1',
						'image-id-2': 'blurhash2',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toMatch(/blurhash[12]/)
		})
	})

	describe('error cases', () => {
		it('should return empty string when ImageBlurHashes is undefined', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: undefined,
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toBe('')
		})

		it('should return empty string when ImageBlurHashes is null', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: null,
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toBe('')
		})

		it('should return empty string when requested ImageType does not exist', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {
						'image-id': 'blurhash123',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto, ImageType.Backdrop)

			expect(result).toBe('')
		})

		it('should return empty string when ImageBlurHashes[type] is empty object', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toBe('')
		})
	})

	describe('BaseItemDtoSlimified support', () => {
		it('should work with BaseItemDtoSlimified type', () => {
			const mockItem: Partial<BaseItemDtoSlimified> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {
						'image-id': 'slimified-blurhash',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDtoSlimified)

			expect(result).toBe('slimified-blurhash')
		})
	})

	describe('default ImageType behavior', () => {
		it('should use ImageType.Primary as default', () => {
			const mockItem: Partial<BaseItemDto> = {
				ImageBlurHashes: {
					[ImageType.Primary]: {
						'primary-id': 'primary-blurhash',
					},
					[ImageType.Backdrop]: {
						'backdrop-id': 'backdrop-blurhash',
					},
				},
			}

			const result = getBlurhashFromDto(mockItem as BaseItemDto)

			expect(result).toBe('primary-blurhash')
		})
	})
})
