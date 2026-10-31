import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import StreamingQuality from '../../../src/enums/audio-quality'

/** The streaming profile as `os` builds it; the module picks its profiles when it loads. */
const profileFor = (os: string, quality: StreamingQuality, version?: string): DeviceProfile => {
	let profile: DeviceProfile | undefined
	jest.isolateModules(() => {
		// The isolated registry has its own react-native, so set the platform on that one.
		const { Platform } = require('react-native')
		Platform.OS = os
		if (version)
			Object.defineProperty(Platform, 'Version', { value: version, configurable: true })
		profile = require('../../../src/utils/audio/device-profiles').getDeviceProfile(
			quality,
			'stream',
		)
	})
	return profile!
}

const directPlays = (
	os: string,
	quality: StreamingQuality,
	container: string,
	codec?: string,
): boolean =>
	profileFor(os, quality).DirectPlayProfiles!.some(
		(p) =>
			p.Container!.split(',').includes(container) &&
			(p.AudioCodec === undefined || p.AudioCodec === codec),
	)

describe('Android direct play', () => {
	it('streams AAC in M4A and MP4 as is, so it keeps a progress bar', () => {
		expect(directPlays('android', StreamingQuality.Original, 'm4a', 'aac')).toBe(true)
		expect(directPlays('android', StreamingQuality.Original, 'mp4', 'aac')).toBe(true)
		expect(directPlays('android', StreamingQuality.Original, 'aac')).toBe(true)
	})

	it('still transcodes ALAC, which Android cannot decode', () => {
		expect(directPlays('android', StreamingQuality.Original, 'm4a', 'alac')).toBe(false)
	})

	it('keeps AAC direct play at lower streaming qualities (it is not lossless)', () => {
		expect(directPlays('android', StreamingQuality.High, 'm4a', 'aac')).toBe(true)
		expect(directPlays('android', StreamingQuality.High, 'flac')).toBe(false)
	})
})

describe('iOS direct play', () => {
	it('streams Opus in Ogg as is on iOS', () => {
		expect(directPlays('ios', StreamingQuality.Original, 'ogg', 'opus')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'opus', 'opus')).toBe(true)
		expect(directPlays('ios', StreamingQuality.High, 'ogg', 'opus')).toBe(true)
	})

	it('caps direct played Opus at 2 channels', () => {
		const opus = profileFor('ios', StreamingQuality.Original).CodecProfiles!.find(
			(p) => p.Codec === 'opus',
		)
		expect(opus?.Conditions).toContainEqual(
			expect.objectContaining({ Property: 'AudioChannels', Value: '2' }),
		)
	})

	it('always transcodes Vorbis, which iOS cannot decode', () => {
		expect(directPlays('ios', StreamingQuality.Original, 'ogg', 'vorbis')).toBe(false)
		expect(directPlays('ios', StreamingQuality.Original, 'ogg', 'vorbis')).toBe(false)
	})
})
