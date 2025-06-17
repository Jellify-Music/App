import { isEmpty } from 'lodash'
import { QueuingType } from '../../../enums/queuing-type'
import JellifyTrack from '../../../types/JellifyTrack'
import { getActiveTrackIndex } from 'react-native-track-player/lib/src/trackPlayer'

/**
 * Finds and returns the index of the player queue to insert additional tracks into
 * @param playQueue The current player queue
 * @returns The index to insert songs to play next at
 */
export const findPlayNextIndexStart = async (playQueue: JellifyTrack[]) => {
	if (isEmpty(playQueue)) return 0

	return (await getActiveTrackIndex())! + 1
}

/**
 * Finds and returns the index of the play queue to insert user queue tracks into
 * @param playQueue The current player queue
 * @returns The index to insert songs to add to the user queue
 */
export const findPlayQueueIndexStart = async (playQueue: JellifyTrack[]) => {
	if (isEmpty(playQueue)) return 0

	const activeIndex = await getActiveTrackIndex()

	if (playQueue.findIndex((track) => track.QueuingType === QueuingType.FromSelection) === -1)
		return activeIndex! + 1

	return playQueue.findIndex(
		(queuedTrack, index) =>
			queuedTrack.QueuingType === QueuingType.FromSelection && index > activeIndex!,
	)
}
