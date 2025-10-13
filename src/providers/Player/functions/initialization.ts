import { isUndefined } from 'lodash'
import TrackPlayer from 'react-native-track-player'
import { usePlayerQueueStore } from '@/src/stores/player/queue'

export default async function Initialize() {
	const storedPlayQueue = usePlayerQueueStore.getState().playQueue
	const storedTrack = usePlayerQueueStore.getState().nowPlaying

	console.debug(
		`storedTrack: ${!isUndefined(storedTrack)}, storedPlayQueue: ${storedPlayQueue?.map((track, index) => index)}, track: ${storedTrack?.item.Id}`,
	)

	if (!isUndefined(storedPlayQueue) && !isUndefined(storedTrack)) {
		console.debug('Initializing play queue from storage')

		await TrackPlayer.reset()
		await TrackPlayer.add(storedPlayQueue)
		await TrackPlayer.skip(storedPlayQueue.indexOf(storedTrack))

		console.debug('Initialized play queue from storage')
	}
}
