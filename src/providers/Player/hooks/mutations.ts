import { useMutation } from '@tanstack/react-query'
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { loadQueue, playLaterInQueue, playNextInQueue } from '../functions/queue'
import { isUndefined } from 'lodash'
import { previous, skip } from '../functions/controls'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import Toast from 'react-native-toast-message'
import { handleDeshuffle, handleShuffle } from '../functions/shuffle'
import JellifyTrack from '@/src/types/JellifyTrack'
import calculateTrackVolume from '../utils/normalization'
import usePlayerEngineStore, { PlayerEngine } from '../../../stores/player/engine'
import { useRemoteMediaClient } from 'react-native-google-cast'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../screens/types'
import { useNavigation } from '@react-navigation/native'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { queryClient } from '../../../constants/query-client'
import { REPEAT_MODE_QUERY_KEY } from '../constants/query-keys'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { useCallback } from 'react'
import { getAudioCache } from '../../../api/mutations/download/offlineModeUtils'

/**
 * A mutation to handle starting playback
 */
export const usePlay = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: TrackPlayer.play,
	})
}

/**
 * A mutation to handle toggling the playback state
 */
export const useTogglePlayback = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	const trigger = useHapticFeedback()

	return useCallback(async () => {
		trigger('impactMedium')
		const { state } = await TrackPlayer.getPlaybackState()

		if (state === State.Playing) {
			console.debug('Pausing playback')
			// handlePlaybackStateChanged(State.Paused)
			if (isCasting && remoteClient) {
				remoteClient.pause()
				return
			} else {
				TrackPlayer.pause()
				return
			}
		}

		const { duration, position } = await TrackPlayer.getProgress()
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
		if (duration <= position) {
			await TrackPlayer.seekTo(0)
		}

		// handlePlaybackStateChanged(State.Playing)
		return TrackPlayer.play()
	}, [isCasting, remoteClient, trigger])
}

export const useToggleRepeatMode = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: async () => {
			const repeatMode = await TrackPlayer.getRepeatMode()

			switch (repeatMode) {
				case RepeatMode.Off:
					TrackPlayer.setRepeatMode(RepeatMode.Queue)
					break
				case RepeatMode.Queue:
					TrackPlayer.setRepeatMode(RepeatMode.Track)
					break
				default:
					TrackPlayer.setRepeatMode(RepeatMode.Off)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: REPEAT_MODE_QUERY_KEY })
		},
	})
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
export const useSeekTo = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	const trigger = useHapticFeedback()

	return useCallback(
		async (position: number) => {
			trigger('impactLight')

			console.log('position', position)
			if (isCasting && remoteClient) {
				await remoteClient.seek({
					position: position,
					resumeState: 'play',
				})
				return
			}
			await TrackPlayer.seekTo(position)
		},
		[isCasting, remoteClient, trigger],
	)
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	const trigger = useHapticFeedback()

	return useCallback(
		async (seekSeconds: number) => {
			trigger('clockTick')

			await TrackPlayer.seekBy(seekSeconds)
		},
		[trigger],
	)
}

export const useAddToQueue = () => {
	const trigger = useHapticFeedback()

	return useCallback(async (variables: AddToQueueMutation) => {
		try {
			if (variables.queuingType === QueuingType.PlayingNext) playNextInQueue({ ...variables })
			else playLaterInQueue({ ...variables })

			trigger('notificationSuccess')
			console.debug(
				`${variables.queuingType === QueuingType.PlayingNext ? 'Played next' : 'Added to queue'}`,
			)
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
			const newQueue = await TrackPlayer.getQueue()

			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])
		}
	}, [])
}

export const useLoadNewQueue = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const trigger = useHapticFeedback()

	return useCallback(
		async (variables: QueueMutation) => {
			trigger('impactLight')
			await TrackPlayer.pause()
			const { finalStartIndex, tracks } = await loadQueue({ ...variables })

			usePlayerQueueStore.getState().setCurrentIndex(finalStartIndex)

			console.debug('Successfully loaded new queue')
			if (isCasting && remoteClient) {
				await TrackPlayer.skip(finalStartIndex)
				navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
				return
			}

			await TrackPlayer.skip(finalStartIndex)

			if (variables.startPlayback) await TrackPlayer.play()

			usePlayerQueueStore.getState().setQueueRef(variables.queue)
			usePlayerQueueStore.getState().setQueue(tracks)
			usePlayerQueueStore.getState().setCurrentTrack(tracks[finalStartIndex])
		},
		[isCasting, remoteClient, navigation, trigger, usePlayerQueueStore],
	)
}

export const usePrevious = () => {
	const trigger = useHapticFeedback()

	return useCallback(async () => {
		trigger('impactMedium')

		await previous()
		console.debug('Skipped to previous track')
	}, [trigger])
}

export const useSkip = () => {
	const trigger = useHapticFeedback()

	return useCallback(
		async (index?: number | undefined) => {
			trigger('impactMedium')

			console.debug(
				`Skip to next triggered. ${!isUndefined(index) ? `Index is using ${index} as index since it was provided` : ''}`,
			)
			await skip(index)
			console.debug('Skipped to next track')
		},
		[trigger],
	)
}

export const useRemoveFromQueue = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: () => trigger('impactMedium'),
		mutationFn: async (index: number) => TrackPlayer.remove([index]),
		onSuccess: async (data: void, index: number) => {
			console.debug(`Removed track at index ${index}`)
		},
		onError: async (error: Error, index: number) => {
			console.error(`Failed to remove track at index ${index}:`, error)
		},
		onSettled: async () => {
			const newQueue = await TrackPlayer.getQueue()

			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])
		},
	})
}

export const useRemoveUpcomingTracks = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: TrackPlayer.removeUpcomingTracks,
		onSuccess: () => trigger('notificationSuccess'),
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to remove upcoming tracks:', error)
		},
		onSettled: async () => {
			const newQueue = await TrackPlayer.getQueue()

			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])
		},
	})
}

export const useReorderQueue = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ from, to }: QueueOrderMutation) => {
			console.debug(
				`TrackPlayer.move(${from}, ${to}) - Queue before move:`,
				(await TrackPlayer.getQueue()).length,
			)

			await TrackPlayer.move(from, to)
		},
		onMutate: async ({ from, to }: { from: number; to: number }) => {
			console.debug(`Reordering queue from ${from} to ${to}`)
		},
		onSuccess: async (_, { from, to }: { from: number; to: number }) => {
			console.debug(`Reordered queue from ${from} to ${to} successfully`)
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to reorder queue:', error)
		},
		onSettled: async () => {
			const newQueue = await TrackPlayer.getQueue()

			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])
		},
	})
}

export const useResetQueue = () =>
	useMutation({
		mutationFn: async () => {
			usePlayerQueueStore.getState().setUnshuffledQueue([])
			usePlayerQueueStore.getState().setShuffled(false)
			usePlayerQueueStore.getState().setQueueRef('Recently Played')
			usePlayerQueueStore.getState().setQueue([])
			usePlayerQueueStore.getState().setCurrentTrack(undefined)
			usePlayerQueueStore.getState().setCurrentIndex(undefined)
			await TrackPlayer.reset()
		},
	})

export const useToggleShuffle = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: async (shuffled: boolean) =>
			shuffled ? await handleDeshuffle() : await handleShuffle(),
		onError: (error) => {
			console.error('Failed to toggle shuffle:', error)
			Toast.show({
				text1: 'Failed to toggle shuffle',
				type: 'error',
			})
		},
		onSuccess: async (_, shuffled) => {
			const newQueue = await TrackPlayer.getQueue()
			usePlayerQueueStore.getState().setQueue(newQueue as JellifyTrack[])

			usePlayerQueueStore.getState().setShuffled(!shuffled)
		},
	})
}

export const useAudioNormalization = () =>
	useCallback(async (track: JellifyTrack) => {
		console.debug('Normalizing audio level')
		const volume = calculateTrackVolume(track)
		await TrackPlayer.setVolume(volume)
		console.debug(`Audio level set to ${volume}`)
		return volume
	}, [])
