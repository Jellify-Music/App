import { Progress, State } from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { convertSecondsToRunTimeTicks } from '../../../utils/runtimeticks'
import { PROGRESS_UPDATE_EVENT_INTERVAL } from '../../../player/config'
import { getCurrentTrack } from '../functions'
import { queryClient } from '../../../constants/query-client'
import { QueryKeys } from '../../../enums/query-keys'
import { StreamingQuality } from '../../Settings'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'

export async function handlePlaybackState(
	playstateApi: PlaystateApi | undefined,
	streamingQuality: StreamingQuality,
	state: State,
) {
	const track = getCurrentTrack()

	if (playstateApi && track) {
		const mediaInfo = queryClient.getQueryData([
			QueryKeys.MediaSources,
			streamingQuality,
			track.item.Id,
		]) as PlaybackInfoResponse | undefined

		switch (state) {
			case State.Playing: {
				console.debug('Report playback started')
				await playstateApi.reportPlaybackStart({
					playbackStartInfo: {
						SessionId: mediaInfo?.PlaySessionId,
						ItemId: track.item.Id,
					},
				})
				break
			}

			case State.Ended:
			case State.Paused:
			case State.Stopped: {
				console.debug('Report playback stopped')
				await playstateApi.reportPlaybackStopped({
					playbackStopInfo: {
						SessionId: mediaInfo?.PlaySessionId,
						ItemId: track.item.Id,
					},
				})
				break
			}

			default: {
				return
			}
		}
	}
}

export async function handlePlaybackProgress(
	playstateApi: PlaystateApi | undefined,
	streamingQuality: StreamingQuality,
	duration: number,
	position: number,
) {
	const track = getCurrentTrack()

	const mediaInfo = queryClient.getQueryData([
		QueryKeys.MediaSources,
		streamingQuality,
		track?.item.Id,
	]) as PlaybackInfoResponse | undefined

	if (playstateApi && track) {
		console.debug('Playback progress updated')
		if (shouldMarkPlaybackFinished(duration, position)) {
			console.debug(`Track finished. ${playstateApi ? 'scrobbling...' : ''}`)

			await playstateApi.reportPlaybackStopped({
				playbackStopInfo: {
					SessionId: mediaInfo?.PlaySessionId,
					ItemId: track.item.Id,
					PositionTicks: convertSecondsToRunTimeTicks(track.duration!),
				},
			})
		} else {
			console.debug('Reporting playback position')
			await playstateApi.reportPlaybackProgress({
				playbackProgressInfo: {
					SessionId: mediaInfo?.PlaySessionId,
					ItemId: track.ItemId,
					PositionTicks: convertSecondsToRunTimeTicks(position),
				},
			})
		}
	}
}

export function shouldMarkPlaybackFinished(duration: number, position: number): boolean {
	return Math.floor(duration) - Math.floor(position) < PROGRESS_UPDATE_EVENT_INTERVAL
}
