import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import reportPlaybackStopped from '../../../api/mutations/playback/functions/playback-stopped'
import isPlaybackFinished from '../../../api/mutations/playback/utils'
import {
	usePlayerPlaybackStore,
	setPlaybackPosition,
	setTotalDuration,
} from '../../../stores/player/playback'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import calculateTrackVolume from '../../../utils/audio/normalization'
import {
	TrackPlayer,
	DownloadManager,
	Reason,
	TrackPlayerState,
	TrackItem,
} from 'react-native-nitro-player'
import { convertRunTimeTicksToSeconds } from '../../../utils/mapping/ticks-to-seconds'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import ensureMediaInfoQuery from '../../../api/queries/media/queries'
import buildAudioApiUrl, {
	buildTranscodedAudioApiUrl,
} from '../../../utils/mapping/item-to-audio-api-url'
import getTrackDto from '../../../utils/mapping/track-extra-payload'

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function resolveTrackUrls(tracks: TrackItem[]) {
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

	await TrackPlayer.updateTracks(updatedTracks)

	const actualQueue = await TrackPlayer.getActualQueue()

	const { currentTrack: storedCurrentTrack } = usePlayerQueueStore.getState()
	const updatedCurrentTrack = actualQueue.find((t) => t.id === storedCurrentTrack?.id)
	if (updatedCurrentTrack) {
		usePlayerQueueStore.getState().setCurrentTrack(updatedCurrentTrack)
	}

	usePlayerQueueStore.getState().setQueue(actualQueue)
}

/**
 * Native callback — skipped while a queuing operation is in progress to
 * prevent races with the explicit resolveTrackUrls call in useLoadNewQueue.
 */
export async function onTracksNeedUpdate(tracks: TrackItem[]) {
	const { isQueuing } = usePlayerQueueStore.getState()
	if (isQueuing) {
		console.info('onTracksNeedUpdate: skipping during queue load')
		return
	}
	await resolveTrackUrls(tracks)
}

export async function onChangeTrack() {
	const { isQueuing } = usePlayerQueueStore.getState()

	// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
	if (isQueuing) {
		console.info('Skipping playback reporting due to ongoing queue change')
		return
	}

	const { currentIndex, currentTrack } = await TrackPlayer.getState()

	// Get the last track and the last known position...
	const previousTrack = usePlayerQueueStore.getState().currentTrack
	const lastPosition = usePlayerPlaybackStore.getState().position

	// ...report that playback has stopped for the previous track, including the last position
	if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
		await reportPlaybackCompleted(previousTrack)
	} else if (previousTrack) {
		await reportPlaybackStopped(previousTrack, lastPosition)
	}

	// Then we can update the store...
	usePlayerQueueStore.getState().setCurrentIndex(currentIndex)
	usePlayerQueueStore.getState().setCurrentTrack(currentTrack!)

	// ...report that playback has started for the new track...
	await reportPlaybackStarted(currentTrack!, 0)

	const { enableAudioNormalization } = usePlayerSettingsStore.getState()

	// ...and apply audio normalization if enabled in settings
	if (enableAudioNormalization) {
		const volume = calculateTrackVolume(currentTrack!)
		TrackPlayer.setVolume(volume)
	}
}

export async function onPlaybackProgress(position: number, totalDuration: number) {
	setPlaybackPosition(position)
	setTotalDuration(totalDuration)

	const { currentTrack } = usePlayerQueueStore.getState()

	if (!currentTrack) return

	await reportPlaybackProgress(currentTrack, position)

	const { autoDownload } = useUsageSettingsStore.getState()

	const isDownloadedOrDownloadPending =
		(await DownloadManager.isTrackDownloaded(currentTrack?.id ?? '')) ||
		(await DownloadManager.isDownloading(currentTrack?.id ?? ''))

	if (
		position / totalDuration > 0.3 &&
		currentTrack &&
		autoDownload &&
		!isDownloadedOrDownloadPending
	) {
		try {
			await DownloadManager.downloadTrack(currentTrack)
		} catch (error) {
			console.warn('Error auto-downloading track:', error)
		}
	}
}

export async function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const currentTrack = usePlayerQueueStore.getState().currentTrack
	const position = usePlayerPlaybackStore.getState().position

	if (!currentTrack || reason === 'skip') return

	if (['paused', 'stopped'].includes(state)) {
		if (isPlaybackFinished(position, currentTrack.duration)) {
			await reportPlaybackCompleted(currentTrack)
		} else {
			await reportPlaybackStopped(currentTrack, position)
		}
	} else if (state === 'playing') {
		await reportPlaybackStarted(currentTrack, position)
	}
}
