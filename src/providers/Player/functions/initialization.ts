import { isUndefined } from 'lodash'
import { getActiveIndex, getCurrentTrack, getPlayQueue } from '.'
import TrackPlayer from 'react-native-track-player'

export default async function Initialize() {
	const storedPlayQueue = getPlayQueue()
	const storedIndex = getActiveIndex()
	const storedTrack = getCurrentTrack()

	console.debug(
		`StoredIndex: ${storedIndex}, storedPlayQueue: ${storedPlayQueue?.map((track, index) => index)}, track: ${storedTrack?.item.Id}`,
	)

	if (!isUndefined(storedPlayQueue) && !isUndefined(storedIndex)) {
		console.debug('Initializing play queue from storage')

		await TrackPlayer.reset()
		await TrackPlayer.add(storedPlayQueue)
		await TrackPlayer.skip(storedIndex)

		console.debug('Initialized play queue from storage')
	}
}
