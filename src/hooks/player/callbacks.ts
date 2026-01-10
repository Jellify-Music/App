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
import useHapticFeedback from '../use-haptic-feedback'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, RepeatMode, TrackPlayer, TrackPlayerState } from 'react-native-nitro-player'

/**
 * A mutation to handle toggling the playback state
 */
export const useTogglePlayback = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	const trigger = useHapticFeedback()

	return async (state: TrackPlayerState | undefined) => {
		trigger('impactMedium')

		if (state === 'playing') {
			if (isCasting && remoteClient) return await remoteClient.pause()
			else return TrackPlayer.pause()
		}

		const position = TrackPlayer.getState().currentPosition
		const duration = TrackPlayer.getState().totalDuration

		if (isCasting && remoteClient) {
			const mediaStatus = await remoteClient.getMediaStatus()
			const streamPosition = mediaStatus?.streamPosition
			if (streamPosition && duration <= streamPosition) {
				await remoteClient.seek({
					position: 0,
					resumeState: 'play',
				})
			}
			await remoteClient.play()
			return
		}

		// if the track has ended, seek to start and play
		if (duration <= position) TrackPlayer.seek(0)

		return TrackPlayer.play()
	}
}

export const useToggleRepeatMode = () => {
	const trigger = useHapticFeedback()

	return async () => {
		trigger('impactLight')
		usePlayerQueueStore.getState().setRepeatMode('off')
	}
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
export const useSeekTo = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	const trigger = useHapticFeedback()

	return async (position: number) => {
		trigger('impactLight')

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
	const trigger = useHapticFeedback()

	return (seekSeconds: number) => {
		trigger('clockTick')

		TrackPlayer.seek(TrackPlayer.getState().currentPosition + seekSeconds)
	}
}

export const useAddToQueue = () => {
	const trigger = useHapticFeedback()

	return (variables: AddToQueueMutation) => {
		try {
			if (variables.queuingType === QueuingType.PlayingNext) playNextInQueue({ ...variables })
			else playLaterInQueue({ ...variables })

			trigger('notificationSuccess')
			Toast.show({
				text1:
					variables.queuingType === QueuingType.PlayingNext
						? 'Playing next'
						: 'Added to queue',
				type: 'success',
			})
		} catch (error) {
			trigger('notificationError')
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
	const trigger = useHapticFeedback()
	return async (variables: QueueMutation) => {
		trigger('impactLight')
		const { finalStartIndex, tracks } = await loadQueue({ ...variables })
	}
}

export const usePrevious = () => {
	const trigger = useHapticFeedback()

	return async () => {
		trigger('impactMedium')

		await previous()
	}
}

export const useSkip = () => {
	const trigger = useHapticFeedback()

	return async (index?: number | undefined) => {
		trigger('impactMedium')

		await skip(index)
	}
}

export const useRemoveFromQueue = () => {
	const trigger = useHapticFeedback()

	return (index: number) => {
		trigger('impactMedium')

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
	const trigger = useHapticFeedback()

	return async (shuffled: boolean) => {
		trigger('impactMedium')

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
