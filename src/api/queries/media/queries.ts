import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/device-profile'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import StreamingQuality from '../../../enums/audio-quality'
import { SourceType } from '../../../types/JellifyTrack'
import { ONE_DAY, queryClient } from '../../../constants/query-client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { EnsureQueryDataOptions } from '@tanstack/react-query'

export const MediaInfoQuery = (itemId: string | null | undefined, source: SourceType) => {
	const api = getApi()

	const streamingProfile = useStreamingDeviceProfileStore.getState().deviceProfile
	const downloadingProfile = useDownloadingDeviceProfileStore.getState().deviceProfile
	const profile = source === 'stream' ? streamingProfile : downloadingProfile

	const streamingQuality = usePlayerSettingsStore.getState().streamingQuality
	const downloadQuality = useUsageSettingsStore.getState().downloadQuality
	const quality = source === 'stream' ? streamingQuality : downloadQuality
	const isQualityLimited = quality !== StreamingQuality.Original

	return {
		queryKey: MediaInfoQueryKey({
			api,
			deviceProfile: profile,
			itemId,
		}),
		queryFn: () => fetchMediaInfo(profile, itemId, isQualityLimited),
		enabled: Boolean(api && profile && itemId),
		staleTime: ONE_DAY,
	} as EnsureQueryDataOptions<PlaybackInfoResponse>
}

export default async function ensureMediaInfoQuery(
	itemId: string | null | undefined,
	source: SourceType,
) {
	return await queryClient.ensureQueryData<PlaybackInfoResponse>(MediaInfoQuery(itemId, source))
}
