import { isUndefined } from 'lodash'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../configs/player.config'
import TrackPlayer, { State } from 'react-native-track-player'

export async function previous(): Promise<void> {
	const { position } = await TrackPlayer.getProgress()

	if (Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) {
		await TrackPlayer.stop()
		await TrackPlayer.skipToPrevious()
	} else await TrackPlayer.seekTo(0)
}

export async function skip(index?: number | undefined): Promise<void> {
	await TrackPlayer.stop()

	if (!isUndefined(index)) await TrackPlayer.skip(index)
	else await TrackPlayer.skipToNext()

	const { state } = await TrackPlayer.getPlaybackState()
	if (state !== State.Playing) await TrackPlayer.play()
}
