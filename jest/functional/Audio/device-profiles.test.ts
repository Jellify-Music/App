type Profile = { DirectPlayProfiles: { Container?: string; AudioCodec?: string }[] }

/** The streaming profile as `os` builds it; the module picks its profiles when it loads. */
const profileFor = (os: string, quality: 'original' | 'high'): Profile => {
	let profile: Profile | undefined
	jest.isolateModules(() => {
		// The isolated registry has its own react-native, so set the platform on that one.
		require('react-native').Platform.OS = os
		profile = require('../../../src/utils/audio/device-profiles').getDeviceProfile(
			quality,
			'stream',
		)
	})
	return profile!
}

const directPlays = (
	os: string,
	quality: 'original' | 'high',
	container: string,
	codec?: string,
): boolean =>
	profileFor(os, quality).DirectPlayProfiles.some(
		(p) => p.Container === container && (p.AudioCodec === undefined || p.AudioCodec === codec),
	)

describe('Android direct play', () => {
	it('streams AAC in M4A and MP4 as is, so it keeps a progress bar', () => {
		expect(directPlays('android', 'original', 'm4a', 'aac')).toBe(true)
		expect(directPlays('android', 'original', 'mp4', 'aac')).toBe(true)
		expect(directPlays('android', 'original', 'aac')).toBe(true)
	})

	it('still transcodes ALAC, which Android cannot decode', () => {
		expect(directPlays('android', 'original', 'm4a', 'alac')).toBe(false)
	})

	it('keeps AAC direct play at lower streaming qualities (it is not lossless)', () => {
		expect(directPlays('android', 'high', 'm4a', 'aac')).toBe(true)
		expect(directPlays('android', 'high', 'flac')).toBe(false)
	})
})
