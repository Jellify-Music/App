import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { loadQueue, playLaterInQueue, playNextInQueue } from './functions/queue'
import { previous, skip } from './functions/controls'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from './interfaces'
import { QueuingType } from '../../enums/queuing-type'
import Toast from 'react-native-toast-message'
import JellifyTrack from '@/src/types/JellifyTrack'
import calculateTrackVolume from './functions/normalization'
import usePlayerEngineStore, { PlayerEngine } from '../../stores/player/engine'
import { useRemoteMediaClient } from 'react-native-google-cast'
import { triggerHaptic } from '../use-haptic-feedback'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { togglePlayback, toggleRepeatMode } from './functions/playback'
import { toggleShuffle } from './functions/shuffle'

/**
 * A mutation to handle toggling the playback state
 *
 * @deprecated Use the function this invokes directly
 */
export const useTogglePlayback = () => {
	return togglePlayback
}

export const useToggleRepeatMode = () => {
	return toggleRepeatMode
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
export const useSeekTo = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	return async (position: number) => {
		triggerHaptic('impactLight')

		if (isCasting && remoteClient)
			return await remoteClient.seek({
				position: position,
				resumeState: 'play',
			})
		else await TrackPlayer.seekTo(position)
	}
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	return async (seekSeconds: number) => {
		triggerHaptic('clockTick')

		await TrackPlayer.seekBy(seekSeconds)
	}
}

export const useAddToQueue = () => {
	return async (variables: AddToQueueMutation) => {
		try {
			if (variables.queuingType === QueuingType.PlayingNext) playNextInQueue({ ...variables })
			else playLaterInQueue({ ...variables })

			triggerHaptic('notificationSuccess')
			Toast.show({
				text1:
					variables.queuingType === QueuingType.PlayingNext
						? 'Playing next'
						: 'Added to queue',
				type: 'success',
			})
		} catch (error) {
			triggerHaptic('notificationError')
			console.error(
				`Failed to ${variables.queuingType === QueuingType.PlayingNext ? 'play next' : 'add to queue'}`,
				error,
			)
			Toast.show({
				text1:
					variables.queuingType === QueuingType.PlayingNext
						? 'Failed to play next'
						: 'Failed to add to queue',
				type: 'error',
			})
		} finally {
			const newQueue = await TrackPlayer.getQueue()

			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])
		}
	}
}

export const useLoadNewQueue = () => {
	return async (variables: QueueMutation) => {
		triggerHaptic('impactLight')
		const { finalStartIndex, tracks } = await loadQueue({ ...variables })
	}
}

/**
 * @deprecated Use the function this invokes directly
 */
export const usePrevious = () => {
	return async () => {
		await previous()
	}
}

/**
 * @deprecated Use the function this invokes directly
 */
export const useSkip = () => {
	return async (index?: number | undefined) => {
		await skip(index)
	}
}

export const useRemoveFromQueue = () => {
	return async (index: number) => {
		triggerHaptic('impactMedium')
		await TrackPlayer.remove([index])

		const prevQueue = usePlayerQueueStore.getState().queue
		const newQueue = prevQueue.filter((_, i) => i !== index)

		usePlayerQueueStore.getState().setQueue(newQueue)

		// If queue is now empty, reset player state to hide miniplayer
		if (newQueue.length === 0) {
			usePlayerQueueStore.getState().setCurrentTrack(undefined)
			usePlayerQueueStore.getState().setCurrentIndex(undefined)
			await TrackPlayer.reset()
		}
	}
}

export const useRemoveUpcomingTracks = () => {
	return async () => {
		await TrackPlayer.removeUpcomingTracks()
		const newQueue = await TrackPlayer.getQueue()

		usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])

		// If queue is now empty, reset player state to hide miniplayer
		if (newQueue.length === 0) {
			usePlayerQueueStore.getState().setCurrentTrack(undefined)
			usePlayerQueueStore.getState().setCurrentIndex(undefined)
			await TrackPlayer.reset()
		}
	}
}

export const useReorderQueue = () => {
	return async ({ fromIndex, toIndex }: QueueOrderMutation) => {
		await TrackPlayer.move(fromIndex, toIndex)

		const queue = usePlayerQueueStore.getState().queue

		const itemToMove = queue[fromIndex]
		const newQueue = [...queue]
		newQueue.splice(fromIndex, 1)
		newQueue.splice(toIndex, 0, itemToMove)

		usePlayerQueueStore.getState().setQueue(newQueue)
	}
}

export const useResetQueue = () => async () => {
	usePlayerQueueStore.getState().setUnshuffledQueue([])
	usePlayerQueueStore.getState().setShuffled(false)
	usePlayerQueueStore.getState().setQueueRef('Recently Played')
	usePlayerQueueStore.getState().setQueue([])
	usePlayerQueueStore.getState().setCurrentTrack(undefined)
	usePlayerQueueStore.getState().setCurrentIndex(undefined)
	return await TrackPlayer.reset()
}

export const useToggleShuffle = () => {
	return toggleShuffle
}

export const useAudioNormalization = () => async (track: JellifyTrack) => {
	const volume = calculateTrackVolume(track)
	await TrackPlayer.setVolume(volume)
	return volume
}
