/**
 * This file incorporates code from Jellyfin iOS
 *
 * Original Source: https://github.com/jellyfin/jellyfin-ios/blob/042a48248fc23d3749d5d5991a2e1c63c0b10e7d/utils/profiles/base.ts
 * Copyright (c) 2025 Jellyfin Contributors - licensed under the Mozilla Public License 2.0
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
	DeviceProfile,
	DlnaProfileType,
	EncodingContext,
	MediaStreamProtocol,
} from '@jellyfin/sdk/lib/generated-client'
import { StreamingQuality } from '..'
import { Platform } from 'react-native'
import { getQualityParams } from '../../../utils/mappings'
import { capitalize } from 'lodash'
import { SourceType } from '../../../types/JellifyTrack'

/**
 * A constant that defines the options for the {@link useDeviceProfile} hook - building the
 * {@link DeviceProfile}
 *
 * @param streamingQuality The {@link StreamingQuality} defined by the user in the settings
 * @returns the query options
 *
 * Huge thank you to Bill on the Jellyfin Team for helping us with this! 💜
 */
export function getDeviceProfile(
	streamingQuality: StreamingQuality,
	type: SourceType,
): DeviceProfile {
	const isApple = Platform.OS === 'ios' || Platform.OS === 'macos'

	const platformProfile = isApple ? APPLE_PLATFORM_PROFILE : DEFAULT_PLATFORM_PROFILE

	return {
		Name: `${capitalize(streamingQuality)} Quality Audio ${capitalize(type)}`,
		MaxStaticBitrate:
			streamingQuality === 'original'
				? 100_000_000
				: getQualityParams(streamingQuality)?.AudioBitRate,
		MaxStreamingBitrate:
			streamingQuality === 'original'
				? 120_000_000
				: getQualityParams(streamingQuality)?.AudioBitRate,
		MusicStreamingTranscodingBitrate: getQualityParams(streamingQuality)?.AudioBitRate,
		ContainerProfiles: [],
		...platformProfile,
	} as DeviceProfile
}

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
		// {
		// 	Container: 'aac',
		// 	Type: DlnaProfileType.Audio,
		// },
		// {
		// 	AudioCodec: 'aac',
		// 	Container: 'm4a',
		// 	Type: DlnaProfileType.Audio,
		// },
		// {
		// 	AudioCodec: 'aac',
		// 	Container: 'm4b',
		// 	Type: DlnaProfileType.Audio,
		// },
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
		// {
		// 	AudioCodec: 'aac',
		// 	BreakOnNonKeyFrames: true,
		// 	Container: 'aac',
		// 	Context: EncodingContext.Streaming,
		// 	MaxAudioChannels: '6',
		// 	MinSegments: 2,
		// 	Protocol: MediaStreamProtocol.Hls,
		// 	Type: DlnaProfileType.Audio,
		// },
		// {
		// 	AudioCodec: 'aac',
		// 	Container: 'aac',
		// 	Context: EncodingContext.Streaming,
		// 	MaxAudioChannels: '6',
		// 	Protocol: MediaStreamProtocol.Http,
		// 	Type: DlnaProfileType.Audio,
		// },
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
		// {
		// 	AudioCodec: 'aac',
		// 	Container: 'aac',
		// 	Context: EncodingContext.Static,
		// 	MaxAudioChannels: '6',
		// 	Protocol: MediaStreamProtocol.Http,
		// 	Type: DlnaProfileType.Audio,
		// },
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
