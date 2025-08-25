import { useMutation } from '@tanstack/react-query'
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { loadQueue, playInQueue, playNextInQueue } from '../functions/queue'
import { trigger } from 'react-native-haptic-feedback'
import { isUndefined } from 'lodash'
import { previous, skip } from '../functions/controls'
import { AddToQueueMutation, QueueOrderMutation } from '../interfaces'
import { refetchNowPlaying, refetchPlayerQueue, invalidateRepeatMode } from '../functions/queries'
import { QueuingType } from '../../../enums/queuing-type'
import Toast from 'react-native-toast-message'
import {
	getActiveIndex,
	getPlayQueue,
	setQueueRef,
	setShuffled,
	setUnshuffledQueue,
} from '../functions'
import { handleDeshuffle, handleShuffle } from '../functions/shuffle'
import JellifyTrack from '@/src/types/JellifyTrack'
import calculateTrackVolume from '../utils/normalization'

const PLAYER_MUTATION_OPTIONS = {
	retry: false,
}

/**
 *
 * @returns a mutation hook
 */
export const useInitialization = () =>
	useMutation({
		mutationFn: async () => {
			const storedPlayQueue = getPlayQueue()
			const storedIndex = getActiveIndex()

			console.debug(
				`StoredIndex: ${storedIndex}, storedPlayQueue: ${storedPlayQueue?.map((track, index) => index)}`,
			)

			if (storedPlayQueue && storedIndex) {
				console.debug('Initializing play queue from storage')

				await TrackPlayer.setQueue(storedPlayQueue)
				await TrackPlayer.skip(storedIndex)

				console.debug('Initialized play queue from storage')
			}
		},
		onSuccess: async () => console.debug('Play Queue initialized from queryables'),
	})

/**
 * A mutation to handle starting playback
 */
export const usePlay = () =>
	useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: TrackPlayer.play,
	})

/**
 * A mutation to handle toggling the playback state
 */
export const useTogglePlayback = () =>
	useMutation({
		mutationFn: async () => {
			trigger('impactMedium')

			const { state } = await TrackPlayer.getPlaybackState()

			if (state === State.Playing) {
				console.debug('Pausing playback')
				// handlePlaybackStateChanged(State.Paused)
				return TrackPlayer.pause()
			}

			const { duration, position } = await TrackPlayer.getProgress()

			// if the track has ended, seek to start and play
			if (duration <= position) {
				await TrackPlayer.seekTo(0)
			}

			// handlePlaybackStateChanged(State.Playing)
			return TrackPlayer.play()
		},
	})

export const useToggleRepeatMode = () =>
	useMutation({
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

/**
 * A mutation to handle seeking to a specific position in the track
 */
export const useSeekTo = () =>
	useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: async (position: number) => {
			await TrackPlayer.seekTo(position)
		},
	})

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () =>
	useMutation({
		mutationFn: async (seekSeconds: number) => {
			trigger('clockTick')

			await TrackPlayer.seekBy(seekSeconds)
		},
	})

export const useAddToQueue = () =>
	useMutation({
		mutationFn: (variables: AddToQueueMutation) =>
			variables.queuingType === QueuingType.PlayingNext
				? playNextInQueue(variables)
				: playInQueue(variables),
		onSuccess: (data: void, { queuingType }: AddToQueueMutation) => {
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

export const useLoadNewQueue = () =>
	useMutation({
		onMutate: async () => {
			trigger('impactLight')
			await TrackPlayer.pause()
		},
		mutationFn: loadQueue,
		onSuccess: async (finalStartIndex, { startPlayback }) => {
			console.debug('Successfully loaded new queue')

			await TrackPlayer.skip(finalStartIndex)

			if (startPlayback) await TrackPlayer.play()
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to load new queue', error)
		},
		onSettled: refetchPlayerQueue,
	})

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

export const useSkip = () =>
	useMutation({
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

export const useRemoveFromQueue = () =>
	useMutation({
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

export const useRemoveUpcomingTracks = () =>
	useMutation({
		mutationFn: TrackPlayer.removeUpcomingTracks,
		onSuccess: () => trigger('notificationSuccess'),
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to remove upcoming tracks:', error)
		},
		onSettled: refetchPlayerQueue,
	})

export const useReorderQueue = () =>
	useMutation({
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
			trigger('notificationSuccess')
			console.debug(`Reordered queue from ${from} to ${to} successfully`)
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to reorder queue:', error)
		},
		onSettled: refetchPlayerQueue,
	})

export const useResetQueue = () =>
	useMutation({
		mutationFn: async () => {
			setUnshuffledQueue([])
			setShuffled(false)
			setQueueRef('Recently Played')
			await TrackPlayer.reset()
		},
		onSettled: refetchPlayerQueue,
	})

export const useToggleShuffle = () =>
	useMutation({
		onMutate: () => trigger('impactLight'),
		mutationFn: async (shuffled: boolean | undefined) =>
			shuffled ? await handleDeshuffle() : await handleShuffle(),
		onError: (error) => {
			console.error('Failed to toggle shuffle:', error)
			Toast.show({
				text1: 'Failed to toggle shuffle',
				type: 'error',
			})
		},
		onSuccess: refetchPlayerQueue,
	})

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
