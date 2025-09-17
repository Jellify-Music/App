import { useMutation } from '@tanstack/react-query'
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { loadQueue, playLaterInQueue, playNextInQueue } from '../functions/queue'
import { isUndefined } from 'lodash'
import { previous, skip } from '../functions/controls'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from '../interfaces'
import {
	refetchNowPlaying,
	refetchPlayerQueue,
	invalidateRepeatMode,
	refetchActiveIndex,
} from '../functions/queries'
import { QueuingType } from '../../../enums/queuing-type'
import Toast from 'react-native-toast-message'
import { handleDeshuffle, handleShuffle } from '../functions/shuffle'
import JellifyTrack from '@/src/types/JellifyTrack'
import calculateTrackVolume from '../utils/normalization'
import { usePlaybackState } from './queries'
import usePlayerEngineStore, { PlayerEngine } from '../../../stores/player/engine'
import { useRemoteMediaClient } from 'react-native-google-cast'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { useAllDownloadedTracks } from '../../../api/queries/download'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { queryClient } from '../../../constants/query-client'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
} from '../constants/query-keys'
import { usePlayerQueueStore, useShuffle } from '../../../stores/player/queue'

const PLAYER_MUTATION_OPTIONS = {
	retry: false,
}

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
	const state = usePlaybackState()
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async () => {
			trigger('impactMedium')

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
		},
	})
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
		onSettled: invalidateRepeatMode,
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

	return useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: async (position: number) => {
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
	})
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	const trigger = useHapticFeedback()

	useMutation({
		mutationFn: async (seekSeconds: number) => {
			trigger('clockTick')

			await TrackPlayer.seekBy(seekSeconds)
		},
	})
}

export const useAddToQueue = () => {
	const downloadedTracks = useAllDownloadedTracks().data

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: (variables: AddToQueueMutation) =>
			variables.queuingType === QueuingType.PlayingNext
				? playNextInQueue({ ...variables, downloadedTracks })
				: playLaterInQueue({ ...variables, downloadedTracks }),
		onSuccess: (_: void, { queuingType }: AddToQueueMutation) => {
			trigger('notificationSuccess')
			console.debug(
				`${queuingType === QueuingType.PlayingNext ? 'Played next' : 'Added to queue'}`,
			)
			Toast.show({
				text1: queuingType === QueuingType.PlayingNext ? 'Playing next' : 'Added to queue',
				type: 'success',
			})
		},
		onError: async (error: Error, { queuingType }: AddToQueueMutation) => {
			trigger('notificationError')
			console.error(
				`Failed to ${queuingType === QueuingType.PlayingNext ? 'play next' : 'add to queue'}`,
				error,
			)
			Toast.show({
				text1:
					queuingType === QueuingType.PlayingNext
						? 'Failed to play next'
						: 'Failed to add to queue',
				type: 'error',
			})
		},
		onSettled: refetchPlayerQueue,
	})
}

export const useLoadNewQueue = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: async () => {
			trigger('impactLight')
			await TrackPlayer.pause()
		},
		mutationFn: (variables: QueueMutation) => loadQueue({ ...variables, downloadedTracks }),
		onSuccess: async ({ finalStartIndex, tracks }, { startPlayback, queue }) => {
			console.debug('Successfully loaded new queue')
			if (isCasting && remoteClient) {
				await TrackPlayer.skip(finalStartIndex)
				navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
				return
			}

			await TrackPlayer.skip(finalStartIndex)

			if (startPlayback) await TrackPlayer.play()

			queryClient.setQueryData(PLAY_QUEUE_QUERY_KEY, tracks)
			queryClient.setQueryData(ACTIVE_INDEX_QUERY_KEY, finalStartIndex)
			queryClient.setQueryData(NOW_PLAYING_QUERY_KEY, tracks[finalStartIndex])

			usePlayerQueueStore.getState().setQueueRef(queue)
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to load new queue', error)
		},
		onSettled: refetchPlayerQueue,
	})
}

export const usePrevious = () =>
	useMutation({
		mutationFn: previous,
		onSuccess: async () => {
			console.debug('Skipped to previous track')
			refetchNowPlaying()
		},
		onError: async (error: Error) => {
			console.error('Failed to skip to previous track:', error)
		},
	})

export const useSkip = () => {
	const trigger = useHapticFeedback()

	return useMutation({
		onMutate: (index?: number | undefined) => {
			trigger('impactMedium')

			console.debug(
				`Skip to next triggered. ${!isUndefined(index) ? `Index is using ${index} as index since it was provided` : ''}`,
			)
		},
		mutationFn: skip,
		onSuccess: async () => {
			console.debug('Skipped to next track')
			refetchNowPlaying()
		},
		onError: async (error: Error) => {
			console.error('Failed to skip to next track:', error)
		},
	})
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
		onSettled: refetchPlayerQueue,
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
		onSettled: refetchPlayerQueue,
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
		onSettled: refetchPlayerQueue,
	})
}

export const useResetQueue = () =>
	useMutation({
		mutationFn: async () => {
			usePlayerQueueStore.getState().setUnshuffledQueue([])
			usePlayerQueueStore.getState().setShuffled(false)
			usePlayerQueueStore.getState().setQueueRef('Recently Played')
			await TrackPlayer.reset()
		},
		onSettled: refetchPlayerQueue,
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
			usePlayerQueueStore.getState().setShuffled(!shuffled)
			refetchPlayerQueue()
		},
	})
}

export const useAudioNormalization = () =>
	useMutation({
		onMutate: () => console.debug('Normalizing audio level'),
		mutationFn: async (track: JellifyTrack) => {
			const volume = calculateTrackVolume(track)
			await TrackPlayer.setVolume(volume)
			return volume
		},
		onSuccess: (volume) => console.debug(`Audio level set to ${volume}`),
		onError: (error) => console.error('Failed to apply audio normalization', error),
	})
