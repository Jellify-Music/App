import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { StreamingQuality } from '../../../src/enums/audio-quality'
import { SourceType } from '../../../src/types/JellifyTrack'

/**
 * The streaming profile as {@link Platform.OS} builds it.
 * The module picks its profiles when it loads.
 */
const profileFor = (
	os: string,
	quality: StreamingQuality,
	type: SourceType = 'stream',
): DeviceProfile => {
	let profile: DeviceProfile | undefined
	jest.isolateModules(() => {
		// The isolated registry has its own react-native, so set the platform on that one.
		const { Platform } = require('react-native')
		Platform.OS = os
		profile = require('../../../src/utils/audio/device-profiles').getDeviceProfile(
			quality,
			type,
		)
	})
	return profile!
}

/**
 * Checks if a given container and codec combination can be directly played on the specified OS and streaming quality.
 *
 * @param os The operating system to simulate (e.g., 'ios', 'android')
 * @param quality The streaming quality to test
 * @param container The media container format (e.g., 'm4a', 'mp4', 'ogg')
 * @param codec The audio codec (e.g., 'aac', 'opus')
 * @returns Whether the specified container and codec are supported for direct play on the given OS and quality
 */
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

const LOSSY_QUALITIES = [StreamingQuality.High, StreamingQuality.Medium, StreamingQuality.Low]

describe('Profile metadata', () => {
	it('names the profile after the quality and source type', () => {
		expect(profileFor('ios', StreamingQuality.High).Name).toBe('High Quality Audio Stream')
		expect(profileFor('android', StreamingQuality.Original, 'download').Name).toBe(
			'Original Quality Audio Download',
		)
	})

	it('gives every profile a unique id', () => {
		const first = profileFor('ios', StreamingQuality.Original)
		const second = profileFor('ios', StreamingQuality.Original)
		expect(first.Id).toBeTruthy()
		expect(first.Id).not.toBe(second.Id)
	})
})

describe('Bitrate limits', () => {
	it('effectively removes the bitrate caps at original quality', () => {
		const profile = profileFor('ios', StreamingQuality.Original)
		expect(profile.MaxStaticBitrate).toBe(100_000_000)
		expect(profile.MaxStaticMusicBitrate).toBe(100_000_000)
		expect(profile.MaxStreamingBitrate).toBe(120_000_000)
		expect(profile.MusicStreamingTranscodingBitrate).toBeUndefined()
	})

	it.each([
		[StreamingQuality.High, 320_000],
		[StreamingQuality.Medium, 256_000],
		[StreamingQuality.Low, 192_000],
	])('caps every bitrate at %s quality to %i', (quality, bitrate) => {
		const profile = profileFor('android', quality)
		expect(profile.MaxStaticBitrate).toBe(bitrate)
		expect(profile.MaxStaticMusicBitrate).toBe(bitrate)
		expect(profile.MaxStreamingBitrate).toBe(bitrate)
		expect(profile.MusicStreamingTranscodingBitrate).toBe(bitrate)
	})

	it('builds the same bitrate limits on every platform', () => {
		const pick = ({
			Id,
			DirectPlayProfiles,
			TranscodingProfiles,
			CodecProfiles,
			...rest
		}: DeviceProfile) => rest
		for (const quality of Object.values(StreamingQuality)) {
			const ios = pick(profileFor('ios', quality))
			expect(pick(profileFor('android', quality))).toEqual(ios)
			expect(pick(profileFor('web', quality))).toEqual(ios)
		}
	})
})

describe('Lossless filtering', () => {
	it.each(['ios', 'android'])('direct plays FLAC and WAV at original quality on %s', (os) => {
		expect(directPlays(os, StreamingQuality.Original, 'flac')).toBe(true)
		expect(directPlays(os, StreamingQuality.Original, 'wav')).toBe(true)
	})

	it.each(LOSSY_QUALITIES)('transcodes FLAC and WAV at %s quality', (quality) => {
		for (const os of ['ios', 'android', 'web']) {
			expect(directPlays(os, quality, 'flac')).toBe(false)
			expect(directPlays(os, quality, 'wav')).toBe(false)
		}
	})

	it.each(LOSSY_QUALITIES)('transcodes ALAC on iOS at %s quality', (quality) => {
		expect(directPlays('ios', quality, 'm4a', 'alac')).toBe(false)
		expect(directPlays('ios', quality, 'm4b', 'alac')).toBe(false)
	})

	it.each(LOSSY_QUALITIES)('keeps lossy formats direct playing at %s quality', (quality) => {
		expect(directPlays('ios', quality, 'mp3')).toBe(true)
		expect(directPlays('ios', quality, 'm4a', 'aac')).toBe(true)
		expect(directPlays('ios', quality, 'ogg', 'opus')).toBe(true)
		expect(directPlays('android', quality, 'mp3')).toBe(true)
		expect(directPlays('android', quality, 'ogg', 'opus')).toBe(true)
	})

	it('does not leak the lossy filter into later original quality profiles', () => {
		jest.isolateModules(() => {
			const { Platform } = require('react-native')
			Platform.OS = 'ios'
			const { getDeviceProfile } = require('../../../src/utils/audio/device-profiles')

			const high: DeviceProfile = getDeviceProfile(StreamingQuality.High, 'stream')
			const original: DeviceProfile = getDeviceProfile(StreamingQuality.Original, 'stream')

			expect(original.DirectPlayProfiles!.length).toBeGreaterThan(
				high.DirectPlayProfiles!.length,
			)
			expect(original.DirectPlayProfiles).toContainEqual(
				expect.objectContaining({ Container: 'flac' }),
			)
		})
	})
})

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

	it('direct plays every Ogg codec, including Vorbis', () => {
		expect(directPlays('android', StreamingQuality.Original, 'ogg', 'vorbis')).toBe(true)
		expect(directPlays('android', StreamingQuality.Original, 'ogg', 'opus')).toBe(true)
	})

	it('has no codec conditions', () => {
		expect(profileFor('android', StreamingQuality.Original).CodecProfiles).toBeUndefined()
	})
})

describe('iOS direct play', () => {
	it('streams Opus in Ogg as is on iOS', () => {
		expect(directPlays('ios', StreamingQuality.Original, 'ogg', 'opus')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'opus', 'opus')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'oga', 'opus')).toBe(true)
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
		for (const quality of Object.values(StreamingQuality)) {
			expect(directPlays('ios', quality, 'ogg', 'vorbis')).toBe(false)
			expect(directPlays('ios', quality, 'oga', 'vorbis')).toBe(false)
		}
	})

	it('streams AAC and ALAC in M4A and M4B as is at original quality', () => {
		expect(directPlays('ios', StreamingQuality.Original, 'm4a', 'aac')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'm4b', 'aac')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'm4a', 'alac')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'm4b', 'alac')).toBe(true)
		expect(directPlays('ios', StreamingQuality.Original, 'aac')).toBe(true)
	})

	it('transcodes to AAC', () => {
		expect(profileFor('ios', StreamingQuality.High).TranscodingProfiles).toEqual([
			expect.objectContaining({
				AudioCodec: 'aac',
				Container: 'aac',
				Context: 'Streaming',
				Protocol: 'http',
			}),
		])
	})

	it('builds the same profile on macOS', () => {
		const strip = ({ Id, ...rest }: DeviceProfile) => rest
		expect(strip(profileFor('macos', StreamingQuality.Original))).toEqual(
			strip(profileFor('ios', StreamingQuality.Original)),
		)
	})
})

describe('Other platforms', () => {
	it('only direct plays the universal formats', () => {
		expect(directPlays('web', StreamingQuality.Original, 'mp3')).toBe(true)
		expect(directPlays('web', StreamingQuality.Original, 'flac')).toBe(true)
		expect(directPlays('web', StreamingQuality.Original, 'wav')).toBe(true)
		expect(directPlays('web', StreamingQuality.Original, 'ogg', 'opus')).toBe(false)
		expect(directPlays('web', StreamingQuality.Original, 'm4a', 'aac')).toBe(false)
	})

	it('transcodes to MP3', () => {
		expect(profileFor('web', StreamingQuality.High).TranscodingProfiles).toEqual([
			expect.objectContaining({ AudioCodec: 'mp3', Container: 'mp3' }),
		])
	})
})

describe('Every platform', () => {
	it.each(['ios', 'android', 'web'])('only declares audio profiles on %s', (os) => {
		const profile = profileFor(os, StreamingQuality.Original)
		for (const p of [...profile.DirectPlayProfiles!, ...profile.TranscodingProfiles!]) {
			expect(p.Type).toBe('Audio')
		}
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
