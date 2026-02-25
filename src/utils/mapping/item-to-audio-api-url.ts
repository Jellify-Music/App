import { SlimifiedBaseItemDto } from '@/src/types/JellifyTrack'
import { getApi } from '../../stores'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client'
import uuid from 'react-native-uuid'

export function buildTranscodedAudioApiUrl(
	playbackInfoResponse: PlaybackInfoResponse | undefined,
): string {
	const api = getApi()

	if (!api) throw new Error('API instance not found')

	return `${api.basePath}${playbackInfoResponse?.MediaSources?.[0].TranscodingUrl}`
}

export default function buildAudioApiUrl(
	item: SlimifiedBaseItemDto,
	playbackInfoResponse: PlaybackInfoResponse | undefined,
): string {
	const api = getApi()

	if (!api) throw new Error('API instance not found')

	let urlParams: Record<string, string> = {}
	let container: string = 'mp3'

	if (playbackInfoResponse?.MediaSources && playbackInfoResponse.MediaSources.length > 0) {
		const mediaSource = playbackInfoResponse.MediaSources[0]

		urlParams = {
			playSessionId: playbackInfoResponse?.PlaySessionId || '',
			startTimeTicks: '0',
			static: 'true',
		}

		if (mediaSource.Container! !== 'mpeg') container = mediaSource.Container!
	} else {
		urlParams = {
			playSessionId: uuid.v4(),
			StartTimeTicks: '0',
			static: 'true',
		}
	}

	return `${api.basePath}/Audio/${item.Id!}/stream?${new URLSearchParams(urlParams)}`
}
