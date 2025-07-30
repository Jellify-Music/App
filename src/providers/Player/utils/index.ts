import { isEmpty, isUndefined } from 'lodash'
import { QueuingType } from '../../../enums/queuing-type'
import JellifyTrack from '../../../types/JellifyTrack'
import TrackPlayer from 'react-native-track-player'

/**
 * Finds and returns the index of the player queue to insert additional tracks into
 * @param playQueue The current player queue
 * @returns The index to insert songs to play next at
 */
export async function findPlayNextIndexStart(playQueue: JellifyTrack[]) {
	if (isEmpty(playQueue)) return 0

	const activeTrack = (await TrackPlayer.getActiveTrack()) as JellifyTrack

	const activeIndex = playQueue.findIndex((track) => track.item.Id === activeTrack?.item.Id)

	if (isUndefined(activeTrack) || activeIndex === -1) return 0
	else return activeIndex + 1
}

/**
 * Finds and returns the index of the play queue to insert user queue tracks into
 * @param playQueue The current player queue
 * @returns The index to insert songs to add to the user queue
 */
export async function findPlayQueueIndexStart(playQueue: JellifyTrack[], currentIndex: number) {
	if (isEmpty(playQueue)) return 0

	if (currentIndex === -1) return 0

	const insertIndex = playQueue.findIndex(
		({ QueuingType: queuingType }, index) =>
			queuingType === QueuingType.FromSelection && index > currentIndex,
	)

	if (insertIndex === -1) return playQueue.length
	else return insertIndex
}
