import {
	DeviceProfile,
	DlnaProfileType,
	EncodingContext,
	MediaStreamProtocol,
} from '@jellyfin/sdk/lib/generated-client'
import { UndefinedInitialDataOptions } from '@tanstack/react-query'
import { DEVICE_PROFILE_QUERY_KEY } from './query-keys'
import { StreamingQuality } from '..'
import { Platform } from 'react-native'
import { getQualityParams } from '../../../utils/mappings'
import { name } from '../../../../package.json'
import { capitalize } from 'lodash'
import { useDeviceProfile } from '../hooks'

/**
 * A constant that defines the options for the {@link useDeviceProfile} hook - building the
 * {@link DeviceProfile}
 *
 * @param streamingQuality The {@link StreamingQuality} defined by the user in the settings
 * @returns the query options
 *
 * Huge thank you to Bill on the Jellyfin Team for helping us with this
 * @see https://github.com/jellyfin/jellyfin-ios/pull/683
 */
export const DEVICE_PROFILE_QUERY: (
	streamingQuality: StreamingQuality,
) => UndefinedInitialDataOptions<unknown, Error, DeviceProfile, readonly unknown[]> = (
	streamingQuality: StreamingQuality,
) => ({
	queryKey: DEVICE_PROFILE_QUERY_KEY(streamingQuality),
	queryFn: () => {
		const isApple = Platform.OS === 'ios' || Platform.OS === 'macos'

		const platformProfile = isApple ? APPLE_PLATFORM_PROFILE : DEFAULT_PLATFORM_PROFILE

		return {
			Name: `${capitalize(name)} ${capitalize(streamingQuality)} Quality Audio Profile`,
			MaxStaticBitrate: 100_000_000, // 100 Mbps
			MaxStreamingBitrate: 120_000_000, // 120 Mbps
			MusicStreamingTranscodingBitrate: getQualityParams(streamingQuality)?.AudioBitRate,
			ContainerProfiles: [],
			...platformProfile,
		} as DeviceProfile
	},
	gcTime: Infinity,
	staleTime: Infinity,
})

/**
 *
 * @param streamingQuality
 * @returns
 */
const APPLE_PLATFORM_PROFILE: DeviceProfile = {
	DirectPlayProfiles: [
		{
			Container: 'mp3',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'aac',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'm4a',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'm4b',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'flac',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'alac',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'alac',
			Container: 'm4a',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'alac',
			Container: 'm4b',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'wav',
			Type: DlnaProfileType.Audio,
		},
	],
	TranscodingProfiles: [
		{
			AudioCodec: 'aac',
			BreakOnNonKeyFrames: true,
			Container: 'aac',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			MinSegments: 2,
			Protocol: MediaStreamProtocol.Hls,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
	],
}

const DEFAULT_PLATFORM_PROFILE: DeviceProfile = {
	DirectPlayProfiles: [
		{
			Container: 'mp3',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'aac',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'm4a',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'm4b',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'flac',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'wav',
			Type: DlnaProfileType.Audio,
		},
	],
	TranscodingProfiles: [
		{
			AudioCodec: 'aac',
			BreakOnNonKeyFrames: true,
			Container: 'aac',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			MinSegments: 2,
			Protocol: MediaStreamProtocol.Hls,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: EncodingContext.Static,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
	],
}
