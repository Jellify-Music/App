/**
 * This file incorporates code from Jellyfin iOS
 *
 * Original Source: https://github.com/jellyfin/jellyfin-ios/blob/042a48248fc23d3749d5d5991a2e1c63c0b10e7d/utils/profiles/base.ts
 * Copyright (c) 2026 Jellyfin Contributors - licensed under the Mozilla Public License 2.0
 *
 * Modifications by Jellify Contributors
 * - Refactored to account for differing platforms using React Native's Platform API
 * - Configurable given a user definable Streaming Quality
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
	CodecType,
	DeviceProfile,
	DirectPlayProfile,
	DlnaProfileType,
	EncodingContext,
	MediaStreamProtocol,
	ProfileConditionType,
	ProfileConditionValue,
} from '@jellyfin/sdk/lib/generated-client'
import { capitalize } from 'lodash'
import { SourceType } from '../../types/JellifyTrack'
import { StreamingQuality, DownloadQuality } from '../../enums/audio-quality'
import uuid from 'react-native-uuid'
import { Platform } from 'react-native'
import { AudioQuality } from '../../types/audio/quality'

/**
 * Gets quality-specific parameters for transcoding
 *
 * @param quality The desired quality for transcoding
 * @returns Object with bitrate and other quality parameters
 */
function getQualityParams(quality: DownloadQuality | StreamingQuality): AudioQuality | undefined {
	switch (quality) {
		case 'original':
			return undefined
		case 'high':
			return {
				AudioBitRate: 320_000,
				MaxAudioBitDepth: '24',
			}
		case 'medium':
			return {
				AudioBitRate: 256_000,
				MaxAudioBitDepth: '16',
			}
		case 'low':
			return {
				AudioBitRate: 192_000,
				MaxAudioBitDepth: '16',
			}
		default:
			return {
				AudioBitRate: 192_000,
				MaxAudioBitDepth: '16',
			}
	}
}

const LOSSLESS_CONTAINERS = new Set(['flac', 'alac', 'wav'])
const LOSSLESS_CODECS = new Set(['alac', 'flac'])

/**
 * A function that defines the options for the {@link useDeviceProfile} hook - building the
 * {@link DeviceProfile}
 *
 * @param streamingQuality The {@link StreamingQuality} defined by the user in the settings
 * @returns the query options
 *
 * Huge thank you to Bill on the Jellyfin Team for helping us with this! 💜
 * @see https://github.com/thornbill
 */
export function getDeviceProfile(
	streamingQuality: StreamingQuality,
	type: SourceType,
): DeviceProfile {
	const qualityParams = getQualityParams(streamingQuality)
	const profiles = PLAYER_PROFILES

	const directPlayProfiles =
		qualityParams == null
			? profiles.DirectPlayProfiles!
			: profiles.DirectPlayProfiles!.filter(
					(p) =>
						!LOSSLESS_CONTAINERS.has(p.Container ?? '') &&
						!LOSSLESS_CODECS.has(p.AudioCodec ?? ''),
				)

	return {
		Id: uuid.v4(),
		Name: `${capitalize(streamingQuality)} Quality Audio ${capitalize(type)}`,
		MaxStaticBitrate:
			streamingQuality === 'original' ? 100_000_000 : qualityParams?.AudioBitRate,
		MaxStreamingBitrate:
			streamingQuality === 'original' ? 120_000_000 : qualityParams?.AudioBitRate,
		MusicStreamingTranscodingBitrate: qualityParams?.AudioBitRate,
		MaxStaticMusicBitrate:
			streamingQuality === 'original' ? 100_000_000 : qualityParams?.AudioBitRate,
		DirectPlayProfiles: directPlayProfiles,
		TranscodingProfiles: getTranscodingProfiles(profiles, type),
		CodecProfiles: profiles.CodecProfiles,
	} as DeviceProfile
}

const getTranscodingProfiles = (profiles: DeviceProfile, type: SourceType) =>
	Platform.OS === 'android' && type === 'download'
		? [
				{
					AudioCodec: 'opus',
					Container: 'ogg',
					Context: EncodingContext.Streaming,
					MaxAudioChannels: '6',
					Protocol: MediaStreamProtocol.Http,
					Type: DlnaProfileType.Audio,
				},
			]
		: (profiles.TranscodingProfiles ?? [])

const UNIVERSAL_PLAYER_PROFILES: DeviceProfile = {
	DirectPlayProfiles: [
		{
			Container: 'mp3',
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
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
	],
}

const ANDROID_PLAYER_PROFILES: DeviceProfile = {
	DirectPlayProfiles: [
		...UNIVERSAL_PLAYER_PROFILES.DirectPlayProfiles!,
		{
			Container: 'ogg',
			Type: DlnaProfileType.Audio,
		},
		// AAC is decoded natively on every Android device, so stream it as is. Transcoding it
		// gives a live stream with no length: no progress bar, no seeking, and work for the
		// server. ALAC (also .m4a) has no built-in decoder and is still transcoded.
		{
			Container: 'm4a',
			AudioCodec: 'aac',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'mp4',
			AudioCodec: 'aac',
			Type: DlnaProfileType.Audio,
		},
		{
			Container: 'aac',
			Type: DlnaProfileType.Audio,
		},
	],
	/**
	 * ExoPlayer can't seek in a progressive transcode: it has no length, so every seek starts the
	 * track over.
	 *
	 * HLS splits the transcode into segments, which ExoPlayer seeks between natively.
	 * Downloads still use the progressive profile, since they need a single file.
	 */
	TranscodingProfiles: [
		{
			AudioCodec: 'aac',
			Container: 'ts',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			MinSegments: 1,
			BreakOnNonKeyFrames: true,
			Protocol: MediaStreamProtocol.Hls,
			Type: DlnaProfileType.Audio,
		},
	],
}

const APPLE_PLAYER_PROFILES: DeviceProfile = {
	DirectPlayProfiles: [
		{
			Container: 'ogg,opus,oga',
			AudioCodec: 'opus',
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
			AudioCodec: 'alac',
			Container: 'm4a',
			Type: DlnaProfileType.Audio,
		},
		{
			AudioCodec: 'alac',
			Container: 'm4b',
			Type: DlnaProfileType.Audio,
		},
		...UNIVERSAL_PLAYER_PROFILES.DirectPlayProfiles!,
	],
	TranscodingProfiles: [
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: EncodingContext.Streaming,
			MaxAudioChannels: '6',
			Protocol: MediaStreamProtocol.Http,
			Type: DlnaProfileType.Audio,
		},
	],
	// Multichannel Opus is untested on AVPlayer, so cap it at stereo like Jellyfin Web does for Safari
	CodecProfiles: [
		{
			Type: CodecType.Audio,
			Codec: 'opus',
			Conditions: [
				{
					Condition: ProfileConditionType.LessThanEqual,
					Property: ProfileConditionValue.AudioChannels,
					Value: '2',
					IsRequired: false,
				},
			],
		},
	],
}

/**
 * Contains the {@link DeviceProfile.DirectPlayProfiles} and
 * {@link DeviceProfile.TranscodingProfiles} for Jellify
 *
 * These are applies to all devices, regardless of platform
 *
 * @returns A {@link DeviceProfile} instance with
 * {@link DeviceProfile.DirectPlayProfiles} and
 * {@link DeviceProfile.TranscodingProfiles} populated
 */
const PLAYER_PROFILES: DeviceProfile = ['ios', 'macos'].includes(Platform.OS)
	? APPLE_PLAYER_PROFILES
	: Platform.OS === 'android'
		? ANDROID_PLAYER_PROFILES
		: UNIVERSAL_PLAYER_PROFILES
