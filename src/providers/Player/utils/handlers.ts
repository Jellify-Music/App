import { Progress, State } from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { convertSecondsToRunTimeTicks } from '../../../utils/runtimeticks'

export async function handlePlaybackState(
	sessionId: string,
	playstateApi: PlaystateApi | undefined,
	track: JellifyTrack,
	state: State,
) {
	if (playstateApi)
		switch (state) {
			case State.Playing: {
				console.debug('Report playback started')
				await playstateApi.reportPlaybackStart({
					playbackStartInfo: {
						SessionId: sessionId,
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
						SessionId: sessionId,
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

export async function handlePlaybackProgress(
	sessionId: string,
	playstateApi: PlaystateApi | undefined,
	track: JellifyTrack,
	progress: Progress,
) {
	console.debug('Playback progress updated')
	if (Math.floor(progress.duration) - Math.floor(progress.position) <= 9) {
		console.debug(`Track finished. ${playstateApi ? 'scrobbling...' : ''}`)

		if (playstateApi)
			await playstateApi.reportPlaybackStopped({
				playbackStopInfo: {
					SessionId: sessionId,
					ItemId: track.item.Id,
					PositionTicks: convertSecondsToRunTimeTicks(track.duration!),
				},
			})
	} else {
		// DO NOTHING, reporting playback will just eat up power
		// Jellyfin can keep track of progress, we're going to intentionally
		// only give it the "greatest hits" (i.e., anything that involves user interaction)
		// console.debug("Reporting playback position");
		// await playstateApi.reportPlaybackProgress({
		//     playbackProgressInfo: {
		//         SessionId: sessionId,
		//         ItemId: track.ItemId,
		//         PositionTicks: convertSecondsToRunTimeTicks(progress.position)
		//     }
		// });
	}
}
