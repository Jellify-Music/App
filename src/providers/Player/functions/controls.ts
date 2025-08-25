import { isUndefined } from 'lodash'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../player/config'
import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'

export async function previous(): Promise<void> {
	const { position } = await TrackPlayer.getProgress()

	console.debug(`Skip to previous triggered. Position is ${position}`)

	if (Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) TrackPlayer.skipToPrevious()
	else await TrackPlayer.seekTo(0)
}

export async function skip(index: number | undefined): Promise<void> {
	if (!isUndefined(index)) await TrackPlayer.skip(index)
	else await TrackPlayer.skipToNext()
}
