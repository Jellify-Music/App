import { parseBitrateFromTranscodingUrl } from '../../src/utils/parsing/url'

describe('parseBitrateFromTranscodingUrl', () => {
	it('should extract AudioBitrate from transcoding URL', () => {
		const url =
			'/Audio/123/universal?UserId=456&AudioBitrate=320000&Container=mp3&TranscodingProtocol=http'
		expect(parseBitrateFromTranscodingUrl(url)).toBe(320000)
	})

	it('should handle AudioBitrate at different positions in URL', () => {
		const url = '/Audio/123/universal?AudioBitrate=192000&UserId=456&Container=mp3'
		expect(parseBitrateFromTranscodingUrl(url)).toBe(192000)
	})

	it('should handle AudioBitrate at end of URL', () => {
		const url = '/Audio/123/universal?UserId=456&Container=mp3&AudioBitrate=128000'
		expect(parseBitrateFromTranscodingUrl(url)).toBe(128000)
	})

	it('should handle high bitrate values', () => {
		const url = '/Audio/123/universal?AudioBitrate=1411000&Container=flac'
		expect(parseBitrateFromTranscodingUrl(url)).toBe(1411000)
	})
})
