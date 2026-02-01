import { loadQueue, playLaterInQueue, playNextInQueue } from './functions/queue'
import { previous, skip } from './functions/controls'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from './interfaces'
import { QueuingType } from '../../enums/queuing-type'
import Toast from 'react-native-toast-message'
import { handleDeshuffle, handleShuffle } from './functions/shuffle'
import JellifyTrack from '@/src/types/JellifyTrack'
import calculateTrackVolume from './functions/normalization'
import usePlayerEngineStore, { PlayerEngine } from '../../stores/player/engine'
import { useRemoteMediaClient } from 'react-native-google-cast'
import { triggerHaptic } from '../use-haptic-feedback'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, RepeatMode, TrackPlayer, TrackPlayerState } from 'react-native-nitro-player'

/**
 * A mutation to handle toggling the playback state
 */
export const useTogglePlayback = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	return async (state: TrackPlayerState | undefined) => {
		triggerHaptic('impactMedium')
		TrackPlayer.pause()
		if (state === 'playing') {
			if (isCasting && remoteClient) return await remoteClient.pause()
			else return TrackPlayer.pause()
		}

		const { currentPosition, totalDuration } = await TrackPlayer.getState()

		// if the track has ended, seek to start and play
		if (totalDuration <= currentPosition) TrackPlayer.seek(0)

		return TrackPlayer.play()
	}
}

export const useToggleRepeatMode = () => {
	return () => {
		const currentMode = usePlayerQueueStore.getState().repeatMode
		triggerHaptic('impactLight')

		let nextMode: RepeatMode

		switch (currentMode) {
			case 'off':
				nextMode = 'Playlist'
				break
			case 'Playlist':
				nextMode = 'track'
				break
			default:
				nextMode = 'off'
		}

		TrackPlayer.setRepeatMode(nextMode)
		usePlayerQueueStore.getState().setRepeatMode(nextMode)
	}
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
		else await TrackPlayer.seek(position)
	}
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	return async (seekSeconds: number) => {
		triggerHaptic('clockTick')

		const { currentPosition } = await TrackPlayer.getState()

		TrackPlayer.seek(currentPosition + seekSeconds)
	}
}

export const useAddToQueue = () => {
	return async (variables: AddToQueueMutation) => {
		try {
			if (variables.queuingType === QueuingType.PlayingNext)
				await playNextInQueue({ ...variables })
			else await playLaterInQueue({ ...variables })

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
			const playlistId = PlayerQueue.getCurrentPlaylistId()!

			usePlayerQueueStore
				.getState()
				.setQueue(PlayerQueue.getPlaylist(playlistId)!.tracks as JellifyTrack[])
		}
	}
}

export const useLoadNewQueue = () => {
	return async (variables: QueueMutation) => {
		triggerHaptic('impactLight')
		const { finalStartIndex, tracks } = await loadQueue({ ...variables })
	}
}

export const usePrevious = () => {
	return async () => {
		triggerHaptic('impactMedium')

		await previous()
	}
}

export const useSkip = () => {
	return async (index?: number | undefined) => {
		triggerHaptic('impactMedium')

		await skip(index)
	}
}

export const useRemoveFromQueue = () => {
	return (index: number) => {
		triggerHaptic('impactMedium')

		const playlistId = PlayerQueue.getCurrentPlaylistId()

		if (!playlistId) return

		const playlist = PlayerQueue.getPlaylist(playlistId)!

		PlayerQueue.removeTrackFromPlaylist(playlistId, playlist.tracks[index].id)

		const prevQueue = usePlayerQueueStore.getState().queue
		const newQueue = prevQueue.filter((_, i) => i !== index)

		usePlayerQueueStore.getState().setQueue(newQueue)

		// If queue is now empty, reset player state to hide miniplayer
		if (newQueue.length === 0) {
			usePlayerQueueStore.getState().setCurrentTrack(undefined)
			usePlayerQueueStore.getState().setCurrentIndex(undefined)
			PlayerQueue.deletePlaylist(playlistId)
		}
	}
}

export const useReorderQueue = () => {
	return ({ fromIndex, toIndex }: QueueOrderMutation) => {
		const playlistId = PlayerQueue.getCurrentPlaylistId()

		if (!playlistId) return

		const { tracks } = PlayerQueue.getPlaylist(playlistId)!

		PlayerQueue.reorderTrackInPlaylist(playlistId, tracks[fromIndex].id, toIndex)

		const queue = usePlayerQueueStore.getState().queue

		const itemToMove = queue[fromIndex]
		const newQueue = [...queue]
		newQueue.splice(fromIndex, 1)
		newQueue.splice(toIndex, 0, itemToMove)

		usePlayerQueueStore.getState().setQueue(newQueue)
	}
}

export const useResetQueue = () => () => {
	usePlayerQueueStore.getState().setUnshuffledQueue([])
	usePlayerQueueStore.getState().setShuffled(false)
	usePlayerQueueStore.getState().setQueueRef('Recently Played')
	usePlayerQueueStore.getState().setQueue([])
	usePlayerQueueStore.getState().setCurrentTrack(undefined)
	usePlayerQueueStore.getState().setCurrentIndex(undefined)
}

export const useToggleShuffle = () => {
	return async (shuffled: boolean) => {
		triggerHaptic('impactMedium')

		if (shuffled) await handleDeshuffle()
		else await handleShuffle()

		const newQueue = PlayerQueue.getPlaylist(PlayerQueue.getCurrentPlaylistId()!)!.tracks

		usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])

		usePlayerQueueStore.getState().setShuffled(!shuffled)
	}
}

export const useAudioNormalization = () => async (track: JellifyTrack) => {
	const volume = calculateTrackVolume(track)
	await TrackPlayer.setVolume(volume)
	return volume
}
