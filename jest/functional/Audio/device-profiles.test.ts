import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { StreamingQuality } from '../../../src/enums/audio-quality'
import { SourceType } from '../../../src/types/JellifyTrack'

/** The profile as `os` builds it; the module picks its profiles when it loads. */
const profileFor = (
	os: string,
	quality: StreamingQuality,
	type: SourceType = 'stream',
): DeviceProfile => {
	let profile: DeviceProfile | undefined
	jest.isolateModules(() => {
		// The isolated registry has its own react-native, so set the platform on that one.
		require('react-native').Platform.OS = os
		profile = require('../../../src/utils/audio/device-profiles').getDeviceProfile(
			quality,
			type,
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
		(p) => p.Container === container && (p.AudioCodec === undefined || p.AudioCodec === codec),
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

describe('Transcoding protocol', () => {
	it('transcodes Android streams to HLS, so they stay seekable', () => {
		expect(profileFor('android', StreamingQuality.High).TranscodingProfiles).toEqual([
			expect.objectContaining({
				AudioCodec: 'aac',
				Container: 'ts',
				Context: 'Streaming',
				Protocol: 'hls',
			}),
		])
	})

	it('keeps Android downloads on a single progressive file', () => {
		expect(
			profileFor('android', StreamingQuality.High, 'download').TranscodingProfiles,
		).toEqual([
			expect.objectContaining({ AudioCodec: 'opus', Container: 'ogg', Protocol: 'http' }),
		])
	})

	it.each(['ios', 'web'])('keeps %s streams progressive', (os) => {
		for (const p of profileFor(os, StreamingQuality.High).TranscodingProfiles!) {
			expect(p.Protocol).toBe('http')
		}
	})
})
