import { useDownloadingDeviceProfileStore } from '../../stores/device-profile'
import { mapDtoToTrack } from '../../utils/mapping/item-to-track'
import { BaseItemDto, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { DownloadedTrack, DownloadManager, PlayerQueue } from 'react-native-nitro-player'
import ensureMediaInfoQuery from '../../api/queries/media/queries'
import buildAudioApiUrl, {
	buildTranscodedAudioApiUrl,
} from '../../utils/mapping/item-to-audio-api-url'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { convertRunTimeTicksToSeconds } from '../../utils/mapping/ticks-to-seconds'
import { queryClient } from '../../constants/query-client'
import ALL_DOWNLOADS_KEY from './keys'

const useDownloadTracks = () =>
	useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const { deviceProfile } = useDownloadingDeviceProfileStore.getState()

			const playlistId = PlayerQueue.createPlaylist('Context Menu Download')

			const tracks = await Promise.all(
				items.map((item) => mapDtoToTrack(item, deviceProfile, 'download')),
			)

			const playbackInfoEntries = await Promise.all(
				tracks.map(async (track) => {
					const playbackInfo = await ensureMediaInfoQuery(track.id, 'stream')
					return [track.id, playbackInfo] as [string, PlaybackInfoResponse]
				}),
			)

			const playbackInfoById = new Map(playbackInfoEntries)

			const updatedTracks = tracks.map((track) => {
				const playbackInfo = playbackInfoById.get(track.id)

				if (!playbackInfo) {
					console.warn(`No playback info found for track ${track.id}`)
					return track
				}

				const transcodingUrl = playbackInfo.MediaSources?.[0]?.TranscodingUrl

				return {
					...track,
					url: transcodingUrl
						? buildTranscodedAudioApiUrl(playbackInfo)
						: buildAudioApiUrl(getTrackDto(track)!, playbackInfo),
					duration: playbackInfo.MediaSources?.[0]?.RunTimeTicks
						? convertRunTimeTicksToSeconds(playbackInfo.MediaSources[0].RunTimeTicks)
						: track.duration,
					extraPayload: {
						...track.extraPayload,
						mediaSourceInfo: playbackInfo.MediaSources?.[0]
							? JSON.stringify(playbackInfo.MediaSources[0])
							: '{}',
						sessionId: playbackInfo.PlaySessionId ?? '',
					},
				}
			})

			PlayerQueue.addTracksToPlaylist(playlistId, updatedTracks)

			await Promise.all(updatedTracks.map((track) => DownloadManager.downloadTrack(track)))

			console.debug(`Downloaded ${updatedTracks.length} tracks from ${items.length} items`)
		},
	})

export const useDeleteDownloads = () => {
	const deleteDownloads = useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const trackIds = items.map((item) => item.Id)
			await Promise.all(trackIds.map((id) => DownloadManager.deleteDownloadedTrack(id!)))
		},
		onSuccess: (_, items) => {
			queryClient.setQueryData(
				ALL_DOWNLOADS_KEY,
				(oldData: DownloadedTrack[] | undefined) => {
					if (!oldData) return []
					return oldData.filter(
						(download) => !items.some((item) => item.Id === download.trackId),
					)
				},
			)
		},
	})

	return {
		mutate: deleteDownloads.mutate,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
