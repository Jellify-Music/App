import React, { ReactNode, useEffect, useState, useMemo, useCallback } from 'react'
import { Queue } from '../../player/types/queue-item'
import { Section } from '../../components/Player/types'
import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from './interfaces'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import JellifyTrack from '../../types/JellifyTrack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../utils/mappings'
import { useNetworkContext } from '../Network'
import { useDownloadQualityContext, useStreamingQualityContext } from '../Settings'
import { QueuingType } from '../../enums/queuing-type'
import TrackPlayer, { Event, Track, useTrackPlayerEvents } from 'react-native-track-player'
import { findPlayQueueIndexStart } from './utils'
import { trigger } from 'react-native-haptic-feedback'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { createContext, useContextSelector } from 'use-context-selector'
import { filterTracksOnNetworkStatus } from './utils/queue'
import { shuffleJellifyTracks } from './utils/shuffle'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../player/config'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '..'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { ensureUpcomingTracksInQueue } from '../../player/helpers/gapless'

/**
 * @description The context for managing the queue
 */
interface QueueContext {
	/**
	 * The reference to the queue, be it a {@link BaseItemDto} or a string
	 */
	queueRef: Queue

	/**
	 * The queue of {@link JellifyTrack}s
	 */
	playQueue: JellifyTrack[]

	/**
	 * The index of the current track in the queue
	 */
	currentIndex: number

	/**
	 * Sets the current index
	 */
	setCurrentIndex: (index: number) => void

	/**
	 * Whether the queue is skipping to a different track. This is used to prevent
	 * flickering of a different track when the user is loading a new queue
	 */
	skipping: boolean

	/**
	 * Fetches the section data for the queue
	 */
	fetchQueueSectionData: () => Section[]

	/**
	 * A hook that adds a track to the queue
	 */
	useAddToQueue: UseMutationResult<void, Error, AddToQueueMutation, unknown>

	/**
	 * Loads a queue of tracks
	 */
	loadQueue: (audioItems: BaseItemDto[], queuingRef: Queue, startIndex: number) => Promise<void>

	/**
	 * A hook that loads a new queue of tracks
	 */
	useLoadNewQueue: (mutation: QueueMutation) => void

	/**
	 * A hook that removes upcoming tracks from the queue
	 */
	useRemoveUpcomingTracks: UseMutationResult<void, Error, void, unknown>

	/**
	 * A hook that removes a track from the queue
	 */
	useRemoveFromQueue: UseMutationResult<void, Error, number, unknown>

	/**
	 * A hook that reorders the queue
	 */
	useReorderQueue: (mutation: QueueOrderMutation) => void

	/**
	 * A hook that skips to the next track
	 */
	useSkip: (index?: number) => void

	/**
	 * A hook that skips to the previous track
	 */
	usePrevious: () => void

	/**
	 * A hook that sets the play queue
	 */
	setPlayQueue: (queue: JellifyTrack[]) => void

	/**
	 * Whether the queue is shuffled
	 */
	shuffled: boolean

	/**
	 * Sets the shuffled state.
	 *
	 * When shuffled, the original queue is stored in {@link unshuffledQueue} and persisted to MMKV
	 *
	 * When not shuffled, the {@link unshuffledQueue} is cleared and the {@link playQueue} is restored.
	 *
	 * @param shuffled Whether the queue is shuffled
	 */
	setShuffled: (shuffled: boolean) => void

	/**
	 * The unshuffled queue. A value is only set when the queue is shuffled. This is used to restore
	 * the original queue when the queue is not shuffled.
	 */
	unshuffledQueue: JellifyTrack[]

	/**
	 * Sets the unshuffled queue.
	 */
	setUnshuffledQueue: (queue: JellifyTrack[]) => void

	/**
	 * Resets the queue
	 */
	resetQueue: () => void
}

const QueueContextInitailizer = () => {
	const currentIndexValue = storage.getNumber(MMKVStorageKeys.CurrentIndex)
	const queueRefJson = storage.getString(MMKVStorageKeys.Queue)
	const playQueueJson = storage.getString(MMKVStorageKeys.PlayQueue)
	const unshuffledQueueJson = storage.getString(MMKVStorageKeys.UnshuffledQueue)

	const queueRefInit = queueRefJson ? JSON.parse(queueRefJson) : 'Recently Played'
	const playQueueInit = playQueueJson ? JSON.parse(playQueueJson) : []
	const unshuffledQueueInit = unshuffledQueueJson ? JSON.parse(unshuffledQueueJson) : []

	const shuffledInit = storage.getBoolean(MMKVStorageKeys.Shuffled)

	//#region State
	const [playQueue, setPlayQueue] = useState<JellifyTrack[]>(playQueueInit)
	const [queueRef, setQueueRef] = useState<Queue>(queueRefInit)
	const [unshuffledQueue, setUnshuffledQueue] = useState<JellifyTrack[]>(unshuffledQueueInit)

	const [currentIndex, setCurrentIndex] = useState<number>(currentIndexValue ?? -1)

	const [skipping, setSkipping] = useState<boolean>(false)

	const [shuffled, setShuffled] = useState<boolean>(shuffledInit ?? false)

	//#endregion State

	//#region Context
	const { api, sessionId } = useJellifyContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()
	const downloadQuality = useDownloadQualityContext()
	const streamingQuality = useStreamingQualityContext()

	//#endregion Context

	useTrackPlayerEvents(
		[Event.PlaybackActiveTrackChanged],
		async ({ index, track }: { index?: number | undefined; track?: Track | undefined }) => {
			console.debug(`Active Track Changed to: ${index}. Skipping: ${skipping}`)
			if (skipping) return

			let newIndex = -1

			if (!isUndefined(track)) {
				const itemIndex = playQueue.findIndex((t) => t.item.Id === track.item.Id)

				if (itemIndex !== -1) {
					newIndex = itemIndex
					console.debug(`Active track changed to item at index: ${itemIndex}`)

					// Ensure upcoming tracks are in correct order (important for shuffle)
					await ensureUpcomingTracksInQueue(playQueue, itemIndex)
				} else {
					console.warn('No index found for active track')
				}
			}

			// If we didn't get an index from the track, use the index provided
			if (newIndex === -1 && !isUndefined(index)) {
				console.debug(`Track is undefined, setting index of active track to ${index}`)
				newIndex = index

				// Ensure upcoming tracks are in correct order (important for shuffle)
				await ensureUpcomingTracksInQueue(playQueue, index)
			} else console.warn('No active track found')

			if (newIndex !== -1) {
				console.debug(`Setting index of active track to ${newIndex}`)
				setCurrentIndex(newIndex)
			} else console.warn('No new index found for active track')
		},
	)

	//#region Functions
	const fetchQueueSectionData: () => Section[] = () => {
		return Object.keys(QueuingType).map((type) => {
			return {
				title: type,
				data: playQueue.filter((track) => track.QueuingType === type),
			} as Section
		})
	}

	/**
	 * Takes a {@link BaseItemDto} of a track on Jellyfin, and updates it's
	 * position in the {@link queue}
	 *
	 *
	 * @param track The Jellyfin track object to update and replace in the queue
	 */
	const replaceQueueItem: (track: BaseItemDto) => Promise<void> = async (track: BaseItemDto) => {
		const queue = (await TrackPlayer.getQueue()) as JellifyTrack[]

		const queueItemIndex = queue.findIndex((queuedTrack) => queuedTrack.item.Id === track.Id!)

		// Update queued item at index if found, else silently do nothing
		if (queueItemIndex !== -1) {
			const queueItem = queue[queueItemIndex]

			const updatedTrack = mapDtoToTrack(
				api!,
				sessionId,
				track,
				downloadedTracks ?? [],
				queueItem.QueuingType,
				downloadQuality,
				streamingQuality,
			)

			// Update app state first
			const newQueue = [...playQueue]
			newQueue[queueItemIndex] = updatedTrack
			setPlayQueue(newQueue)

			// Then update RNTP
			await TrackPlayer.remove([queueItemIndex])
			await TrackPlayer.add(updatedTrack, queueItemIndex)
		}
	}

	const loadQueue = async (
		audioItems: BaseItemDto[],
		queuingRef: Queue,
		startIndex: number = 0,
		shuffleQueue: boolean = false,
	) => {
		trigger('impactLight')
		console.debug(`Queuing ${audioItems.length} items`)

		setSkipping(true)
		setShuffled(shuffleQueue)

		// Get the item at the start index
		const startingTrack = audioItems[startIndex]

		const availableAudioItems = filterTracksOnNetworkStatus(
			networkStatus as networkStatusTypes,
			audioItems,
			downloadedTracks ?? [],
		)

		// Convert to JellifyTracks first
		let queue = availableAudioItems.map((item) =>
			mapDtoToTrack(
				api!,
				sessionId,
				item,
				downloadedTracks ?? [],
				QueuingType.FromSelection,
				downloadQuality,
				streamingQuality,
			),
		)

		// Store the original unshuffled queue
		const originalQueue = [...queue]
		setUnshuffledQueue(originalQueue)

		// If shuffled is requested, shuffle the queue but keep the starting track first
		if (shuffleQueue && queue.length > 1) {
			console.debug('Shuffling queue...')

			// Find the starting track in the converted queue
			const startingJellifyTrack = queue.find((track) => track.item.Id === startingTrack.Id)

			if (startingJellifyTrack) {
				// Remove the starting track from the queue temporarily
				const tracksToShuffle = queue.filter((track) => track.item.Id !== startingTrack.Id)

				// Shuffle the remaining tracks
				const { shuffled: shuffledTracks } = shuffleJellifyTracks(tracksToShuffle)

				// Put the starting track first, followed by shuffled tracks
				queue = [startingJellifyTrack, ...shuffledTracks]

				console.debug(
					`Shuffled ${shuffledTracks.length} tracks, keeping starting track first`,
				)
			} else {
				// Fallback: shuffle the entire queue
				const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
				queue = shuffledTracks
				console.debug(`Shuffled entire queue as fallback`)
			}
		}

		// The start index for the shuffled queue is always 0 (starting track is first)
		const finalStartIndex = shuffleQueue
			? 0
			: availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

		console.debug(
			`Filtered out ${
				audioItems.length - availableAudioItems.length
			} due to network status being ${networkStatus}`,
		)

		console.debug(`Final start index is ${finalStartIndex}`)

		setPlayQueue(queue)
		setCurrentIndex(finalStartIndex)
		setQueueRef(queuingRef)

		await TrackPlayer.pause()
		await TrackPlayer.setQueue(queue)
		await TrackPlayer.skip(finalStartIndex)

		console.debug(
			`Queued ${queue.length} tracks, starting at ${finalStartIndex}${shuffleQueue ? ' (shuffled)' : ''}`,
		)

		// Set skipping to false after a short delay to prevent flickering
		// IDK why this needs to be 1000ms, but there are a lot of events are emitted
		// by RNTP at this time so we need to wait for it to settle
		setTimeout(() => setSkipping(false), 1000)
	}

	/**
	 * Inserts a track at the next index in the queue
	 *
	 * Keeps a copy of the original queue in {@link unshuffledQueue}
	 *
	 * @param item The track to play next
	 */
	const playNextInQueue = async (items: BaseItemDto[]) => {
		console.debug(`Playing item next in queue`)

		const tracksToPlayNext = items.map((item) =>
			mapDtoToTrack(
				api!,
				sessionId,
				item,
				downloadedTracks ?? [],
				QueuingType.PlayingNext,
				downloadQuality,
				streamingQuality,
			),
		)

		// Update app state first to prevent race conditions
		const newQueue = [
			...playQueue.slice(0, currentIndex + 1),
			...tracksToPlayNext,
			...playQueue.slice(currentIndex + 1),
		]
		setPlayQueue(newQueue)

		// Then update RNTP
		await TrackPlayer.add(tracksToPlayNext, currentIndex + 1)

		const nowPlaying = playQueue[currentIndex]

		// Add to the state unshuffled queue, using the currently playing track as the index
		setUnshuffledQueue([
			...unshuffledQueue.slice(0, unshuffledQueue.indexOf(nowPlaying) + 1),
			...tracksToPlayNext,
			...unshuffledQueue.slice(unshuffledQueue.indexOf(nowPlaying) + 1),
		])

		// Show a toast
		Toast.show({
			text1: 'Playing next',
			type: 'success',
		})
	}

	const playInQueue = async (items: BaseItemDto[]) => {
		const insertIndex = await findPlayQueueIndexStart(playQueue, currentIndex)
		console.debug(`Adding ${items.length} to queue at index ${insertIndex}`)

		const newTracks = items.map((item) =>
			mapDtoToTrack(
				api!,
				sessionId,
				item,
				downloadedTracks ?? [],
				QueuingType.DirectlyQueued,
				downloadQuality,
				streamingQuality,
			),
		)

		// Update app state first to prevent race conditions
		const newQueue = [
			...playQueue.slice(0, insertIndex),
			...newTracks,
			...playQueue.slice(insertIndex),
		]
		setPlayQueue(newQueue)

		// Then update RNTP
		await TrackPlayer.add(newTracks, insertIndex)

		// Update unshuffled queue with the same mapped tracks to avoid duplication
		setUnshuffledQueue([...unshuffledQueue, ...newTracks])

		console.debug(`Queue has ${newQueue.length} tracks`)
	}

	const previous = useCallback(async () => {
		trigger('impactMedium')

		const { position } = await TrackPlayer.getProgress()

		console.debug(
			`Skip to previous triggered. Index is ${currentIndex}, position is ${position}`,
		)

		if (currentIndex > 0 && Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) {
			TrackPlayer.skipToPrevious()
		} else await TrackPlayer.seekTo(0)
	}, [currentIndex])

	const skip = useCallback(
		async (index: number | undefined = undefined) => {
			if (!isUndefined(index)) {
				const track = playQueue[index]
				const queue = (await TrackPlayer.getQueue()) as JellifyTrack[]
				const queueIndex = queue.findIndex((t) => t.item.Id === track.item.Id)

				if (queueIndex !== -1) {
					// Track found in TrackPlayer queue, skip to it
					await TrackPlayer.skip(queueIndex)
				} else {
					// Track not found - ensure upcoming tracks are properly ordered
					console.debug('Track not found in TrackPlayer queue, updating upcoming tracks')
					try {
						await ensureUpcomingTracksInQueue(playQueue, currentIndex)

						// Now try to find the track again
						const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
						const updatedQueueIndex = updatedQueue.findIndex(
							(t) => t.item.Id === track.item.Id,
						)

						if (updatedQueueIndex !== -1) {
							await TrackPlayer.skip(updatedQueueIndex)
						} else {
							// If still not found, just update app state and let the system handle it
							await TrackPlayer.skip(index)
							console.debug('Updated app state to index', index)
						}
					} catch (error) {
						console.warn('Failed to ensure upcoming tracks during skip:', error)
						// Fallback: just update app state
						setCurrentIndex(index)
					}
				}
			} else {
				// Default next track behavior
				await TrackPlayer.skipToNext()
			}
		},
		[currentIndex, playQueue],
	)
	//#endregion Functions

	//#region Hooks
	const useAddToQueue = useMutation<void, Error, AddToQueueMutation>({
		mutationFn: ({ tracks, queuingType }: AddToQueueMutation) => {
			return queuingType === QueuingType.PlayingNext
				? playNextInQueue(tracks)
				: playInQueue(tracks)
		},
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
	})

	const { mutate: useLoadNewQueue } = useMutation({
		mutationFn: async ({
			index,
			track,
			tracklist,
			queuingType,
			queue,
			shuffled,
		}: QueueMutation) => loadQueue(tracklist, queue, index, shuffled),
		onSuccess: async (data: void, { startPlayback }: QueueMutation) => {
			trigger('notificationSuccess')
			console.debug(`Loaded new queue`)

			if (startPlayback) await TrackPlayer.play()
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to load new queue:', error)
		},
	})

	const useRemoveFromQueue = useMutation({
		mutationFn: async (index: number) => {
			trigger('impactMedium')

			// Update app state first to prevent race conditions
			const newQueue = playQueue.filter((_, i) => i !== index)
			setPlayQueue(newQueue)

			// Only update unshuffled queue if we're currently shuffled
			if (shuffled && unshuffledQueue.length > 0) {
				// Find the track being removed and remove it from unshuffled queue too
				const trackToRemove = playQueue[index]
				const newUnshuffledQueue = unshuffledQueue.filter(
					(track) => track.item.Id !== trackToRemove.item.Id,
				)
				setUnshuffledQueue(newUnshuffledQueue)
			}

			// Then update RNTP
			await TrackPlayer.remove([index])
		},
		onSuccess: async (data: void, index: number) => {
			console.debug(`Removed track at index ${index}`)
		},
		onError: async (error: Error, index: number) => {
			console.error(`Failed to remove track at index ${index}:`, error)
		},
	})

	/**
	 *
	 */
	const useRemoveUpcomingTracks = useMutation({
		mutationFn: async () => {
			// Update app state first to prevent race conditions
			const newQueue = playQueue.slice(0, currentIndex + 1)
			setPlayQueue(newQueue)

			// Only update unshuffled queue if we're currently shuffled
			if (shuffled && unshuffledQueue.length > 0) {
				// Keep the tracks up to the current playing track in unshuffled queue
				const currentTrack = playQueue[currentIndex]
				const currentUnshuffledIndex = unshuffledQueue.findIndex(
					(track) => track.item.Id === currentTrack?.item.Id,
				)
				if (currentUnshuffledIndex !== -1) {
					const newUnshuffledQueue = unshuffledQueue.slice(0, currentUnshuffledIndex + 1)
					setUnshuffledQueue(newUnshuffledQueue)
				}
			}

			// Then update RNTP
			await TrackPlayer.removeUpcomingTracks()
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to remove upcoming tracks:', error)
			await ensureUpcomingTracksInQueue(playQueue, currentIndex)
		},
	})

	const { mutate: useReorderQueue } = useMutation({
		mutationFn: async ({ from, to }: QueueOrderMutation) => {
			console.debug(
				`TrackPlayer.move(${from}, ${to}) - Queue before move:`,
				(await TrackPlayer.getQueue()).length,
			)

			await TrackPlayer.move(from, to)

			const newQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
			console.debug(`TrackPlayer.move(${from}, ${to}) - Queue after move:`, newQueue.length)

			return newQueue
		},
		onMutate: async ({ from, to }: { from: number; to: number }) => {
			console.debug(`Reordering queue from ${from} to ${to}`)
			console.debug(`App queue before reorder:`, playQueue.length)
			setSkipping(true)
		},
		onSuccess: async (newQueue: JellifyTrack[], { from, to }: { from: number; to: number }) => {
			trigger('notificationSuccess')
			console.debug(`Reordered queue from ${from} to ${to} successfully`)
			console.debug(`App queue after reorder:`, newQueue.length)

			const newCurrentIndex = newQueue.findIndex(
				(track) => track.item.Id === playQueue[currentIndex].item.Id,
			)

			if (newCurrentIndex !== -1) setCurrentIndex(newCurrentIndex)

			setPlayQueue(newQueue)
		},
		onError: async (error: Error) => {
			trigger('notificationError')
			console.error('Failed to reorder queue:', error)

			const queue = (await TrackPlayer.getQueue()) as JellifyTrack[]

			setPlayQueue(queue)
		},
		onSettled: () => {
			setSkipping(false)
		},
		networkMode: 'always',
		retry: false,
	})

	const { mutate: resetQueue } = useMutation({
		mutationFn: async () => {
			setPlayQueue([])
			setCurrentIndex(-1)
			setUnshuffledQueue([])
			setShuffled(false)
			setQueueRef('Recently Played')
			await TrackPlayer.reset()
		},
	})

	const { mutate: useSkip } = useMutation({
		mutationFn: skip,
		onMutate: (index: number | undefined = undefined) => {
			trigger('impactMedium')

			console.debug(
				`Skip to next triggered. Index is ${`using ${
					!isUndefined(index) ? index : currentIndex
				} as index ${!isUndefined(index) ? 'since it was provided' : ''}`}`,
			)
		},
		onSuccess: async () => {
			console.debug('Skipped to next track')
		},
		onError: async (error: Error) => {
			console.error('Failed to skip to next track:', error)
		},
		networkMode: 'always',
		gcTime: 0,
		retry: false,
	})

	const { mutate: usePrevious } = useMutation({
		mutationFn: previous,
		onSuccess: async () => {
			console.debug('Skipped to previous track')
		},
		onError: async (error: Error) => {
			console.error('Failed to skip to previous track:', error)
		},
	})

	//#endregion Hooks

	//#region useEffect(s)

	/**
	 * Store play queue in storage when it changes
	 */
	useEffect(() => {
		if (playQueue.length > 0) {
			console.debug(`Storing play queue of ${playQueue.length} tracks`)
			storage.set(MMKVStorageKeys.PlayQueue, JSON.stringify(playQueue))
		}
	}, [playQueue])

	/**
	 * Store queue ref in storage when it changes
	 */
	useEffect(() => {
		storage.set(MMKVStorageKeys.Queue, JSON.stringify(queueRef))
	}, [queueRef])

	/**
	 * Store current index in storage when it changes
	 */
	useEffect(() => {
		if (typeof currentIndex === 'number' && currentIndex !== -1) {
			console.debug(`Storing current index ${currentIndex}`)
			storage.set(MMKVStorageKeys.CurrentIndex, currentIndex)
		}
	}, [currentIndex])

	useEffect(() => {
		if (unshuffledQueue.length > 0) {
			console.debug(`Storing unshuffled queue of ${unshuffledQueue.length} tracks`)
			storage.set(MMKVStorageKeys.UnshuffledQueue, JSON.stringify(unshuffledQueue))
		}
	}, [unshuffledQueue])

	/**
	 * Store shuffled state in storage when it changes
	 */
	useEffect(() => {
		storage.set(MMKVStorageKeys.Shuffled, shuffled)
	}, [shuffled])

	//#endregion useEffect(s)

	//#region Return
	return useMemo(
		() => ({
			queueRef,
			playQueue,
			setPlayQueue,
			currentIndex,
			setCurrentIndex,
			skipping,
			fetchQueueSectionData,
			loadQueue,
			useAddToQueue,
			useLoadNewQueue,
			useRemoveFromQueue,
			useRemoveUpcomingTracks,
			useReorderQueue,
			useSkip,
			usePrevious,
			shuffled,
			setShuffled,
			unshuffledQueue,
			setUnshuffledQueue,
			resetQueue,
		}),
		[currentIndex, playQueue, shuffled, skipping],
	)
	//#endregion Return
}

export const QueueContext = createContext<QueueContext>({
	queueRef: 'Recently Played',
	playQueue: [],
	currentIndex: -1,
	setCurrentIndex: () => {},
	skipping: false,
	setPlayQueue: () => {},
	fetchQueueSectionData: () => [],
	loadQueue: async () => {},
	useAddToQueue: {
		mutate: () => {},
		mutateAsync: async () => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	useLoadNewQueue: () => {},
	useSkip: () => {},
	usePrevious: () => {},
	useRemoveFromQueue: {
		mutate: () => {},
		mutateAsync: async () => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	useRemoveUpcomingTracks: {
		mutate: () => {},
		mutateAsync: async () => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	useReorderQueue: () => {},
	shuffled: false,
	setShuffled: () => {},
	unshuffledQueue: [],
	setUnshuffledQueue: () => {},
	resetQueue: () => {},
})

export const QueueProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	// Add performance monitoring
	usePerformanceMonitor('QueueProvider', 5)

	const context = QueueContextInitailizer()

	return <QueueContext.Provider value={context}>{children}</QueueContext.Provider>
}

export const useCurrentIndexContext = () =>
	useContextSelector(QueueContext, (context) => context.currentIndex)
export const useQueueRefContext = () =>
	useContextSelector(QueueContext, (context) => context.queueRef)
export const usePlayQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.playQueue)
export const useUnshuffledQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.unshuffledQueue)
export const useShuffledContext = () =>
	useContextSelector(QueueContext, (context) => context.shuffled)

export const useSkippingContext = () =>
	useContextSelector(QueueContext, (context) => context.skipping)

export const useFetchQueueSectionDataContext = () =>
	useContextSelector(QueueContext, (context) => context.fetchQueueSectionData)

export const useLoadQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.useLoadNewQueue)
export const useAddToQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.useAddToQueue)
export const useRemoveFromQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.useRemoveFromQueue)
export const useRemoveUpcomingTracksContext = () =>
	useContextSelector(QueueContext, (context) => context.useRemoveUpcomingTracks)
export const useReorderQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.useReorderQueue)
export const useSkipContext = () => useContextSelector(QueueContext, (context) => context.useSkip)
export const usePreviousContext = () =>
	useContextSelector(QueueContext, (context) => context.usePrevious)

export const useResetQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.resetQueue)
export const useSetShuffledContext = () =>
	useContextSelector(QueueContext, (context) => context.setShuffled)
export const useSetUnshuffledQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.setUnshuffledQueue)
export const useSetPlayQueueContext = () =>
	useContextSelector(QueueContext, (context) => context.setPlayQueue)
export const useSetCurrentIndexContext = () =>
	useContextSelector(QueueContext, (context) => context.setCurrentIndex)
