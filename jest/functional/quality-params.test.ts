import { getQualityParams } from '../../src/utils/mapping/item-to-track'
import { DownloadQuality } from '../../src/stores/settings/usage'
import StreamingQuality from '../../src/enums/audio-quality'

describe('getQualityParams', () => {
	describe('streaming quality', () => {
		it('should return undefined for "original" quality (no transcoding)', () => {
			expect(getQualityParams('original' as StreamingQuality)).toBeUndefined()
		})

		it('should return 320kbps settings for "high" quality', () => {
			const result = getQualityParams('high' as StreamingQuality)
			expect(result).toEqual({
				AudioBitRate: '320000',
				MaxAudioBitDepth: '24',
			})
		})

		it('should return 192kbps settings for "medium" quality', () => {
			const result = getQualityParams('medium' as StreamingQuality)
			expect(result).toEqual({
				AudioBitRate: '192000',
				MaxAudioBitDepth: '16',
			})
		})

		it('should return 128kbps settings for "low" quality', () => {
			const result = getQualityParams('low' as StreamingQuality)
			expect(result).toEqual({
				AudioBitRate: '128000',
				MaxAudioBitDepth: '16',
			})
		})

		it('should default to medium quality for unknown values', () => {
			const result = getQualityParams('unknown' as unknown as StreamingQuality)
			expect(result).toEqual({
				AudioBitRate: '192000',
				MaxAudioBitDepth: '16',
			})
		})
	})

	describe('download quality', () => {
		it('should return undefined for original download quality', () => {
			expect(getQualityParams('original' as DownloadQuality)).toBeUndefined()
		})

		it('should return high quality settings for download', () => {
			const result = getQualityParams('high' as DownloadQuality)
			expect(result?.AudioBitRate).toBe('320000')
		})
	})
})
