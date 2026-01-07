import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getBlurhashFromDto } from '../../src/utils/parsing/blurhash'

describe('getBlurhashFromDto', () => {
	it('should return blurhash value when Primary image exists', () => {
		const dto = {
			ImageBlurHashes: {
				[ImageType.Primary]: {
					abc123: 'L7B$mS01RjWB~qj[ofayRjayWBof',
				},
			},
		}

		expect(getBlurhashFromDto(dto)).toBe('L7B$mS01RjWB~qj[ofayRjayWBof')
	})

	it('should return empty string when ImageBlurHashes is undefined', () => {
		const dto = {}
		expect(getBlurhashFromDto(dto)).toBe('')
	})

	it('should return empty string when requested image type does not exist', () => {
		const dto = {
			ImageBlurHashes: {
				[ImageType.Backdrop]: {
					def456: 'someBackdropHash',
				},
			},
		}

		expect(getBlurhashFromDto(dto, ImageType.Primary)).toBe('')
	})

	it('should retrieve different image types when specified', () => {
		const dto = {
			ImageBlurHashes: {
				[ImageType.Primary]: {
					primary: 'primaryHash',
				},
				[ImageType.Backdrop]: {
					backdrop: 'backdropHash',
				},
				[ImageType.Thumb]: {
					thumb: 'thumbHash',
				},
			},
		}

		expect(getBlurhashFromDto(dto, ImageType.Primary)).toBe('primaryHash')
		expect(getBlurhashFromDto(dto, ImageType.Backdrop)).toBe('backdropHash')
		expect(getBlurhashFromDto(dto, ImageType.Thumb)).toBe('thumbHash')
	})

	it('should handle empty ImageBlurHashes object', () => {
		const dto = {
			ImageBlurHashes: {},
		}
		expect(getBlurhashFromDto(dto)).toBe('')
	})

	it('should return the first key value when multiple tags exist', () => {
		const dto = {
			ImageBlurHashes: {
				[ImageType.Primary]: {
					tag1: 'firstHash',
					tag2: 'secondHash',
				},
			},
		}

		// Should return the first one (Object.keys order)
		expect(getBlurhashFromDto(dto)).toBe('firstHash')
	})
})
