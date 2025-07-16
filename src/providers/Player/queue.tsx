import React, { ReactNode, useContext, useEffect, useState, useMemo } from 'react'
import { createContext } from 'react'
import { Queue } from '../../player/types/queue-item'
import { Section } from '../../components/Player/types'
import { useMutation } from '@tanstack/react-query'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from '../../player/interfaces'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import JellifyTrack from '../../types/JellifyTrack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../utils/mappings'
import { useNetworkContext } from '../Network'
import { useSettingsContext } from '../Settings'
import { QueuingType } from '../../enums/queuing-type'
import TrackPlayer, { Event, useTrackPlayerEvents } from 'react-native-track-player'
import { findPlayQueueIndexStart } from './utils'
import { trigger } from 'react-native-haptic-feedback'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'

import { markItemPlayed } from '../../api/mutations/item'
import { filterTracksOnNetworkStatus } from './utils/queue'
import { shuffleJellifyTracks } from './utils/shuffle'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../player/config'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '..'
import { networkStatusTypes } from '@/src/components/Network/internetConnectionWatcher'
import move from './utils/move'

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
	 * A function that adds a track to the queue
	 */
	addToQueue: (mutation: AddToQueueMutation) => void

	/**
	 * Loads a queue of tracks
	 */
	loadQueue: (audioItems: BaseItemDto[], queuingRef: Queue, startIndex: number) => Promise<void>

	/**
	 * A function that loads a new queue of tracks
	 */
	loadNewQueue: (mutation: QueueMutation) => void

	/**
	 * A function that removes upcoming tracks from the queue
	 */
	removeUpcomingTracks: (mutation: void) => void

	/**
	 * A function that removes a track from the queue by index
	 */
	removeFromQueue: (index: number) => void

	/**
	 * A hook that reorders the queue
	 */
	reorderQueue: (mutation: QueueOrderMutation) => void

	/**
	 * A function that skips to the next track
	 */
	skip: (mutation: number | undefined) => void

	/**
	 * Whether the queue is skipping to the next track
	 */
	skipPending: boolean

	/**
	 * A function that skips to the previous track
	 */
	previous: (mutation: void) => void

	/**
	 * Whether the queue is skipping to the previous track
	 */
	previousPending: boolean

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

function useQueueContextInitializer(): QueueContext {
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
	const { api, sessionId, user } = useJellifyContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()
	const { downloadQuality, streamingQuality } = useSettingsContext()

	//#endregion Context

	useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async ({ index, track }) => {
		console.debug('Active track changed')

		let newIndex = -1

		if (!isUndefined(track)) {
			/**
			 * Find the index of the active track in the play queue
			 *
			 * We are using the track object from the event, because the index is not always accurate
			 * when referencing our Jellify play queue
			 */
			const itemIndex = playQueue.findIndex(
				(t) => t.item.Id === (track as JellifyTrack).item.Id,
			)

			if (!isUndefined(itemIndex) && itemIndex !== -1) {
				newIndex = itemIndex
				console.debug(`Active track changed to index ${itemIndex}`)

				// Ensure upcoming tracks are in correct order (important for shuffle)
				// try {
				// 	const { ensureUpcomingTracksInQueue } = await import(
				// 		'../../player/helpers/gapless'
				// 	)
				// 	await ensureUpcomingTracksInQueue(playQueue, index)
				// } catch (error) {
				// 	console.debug('Failed to ensure upcoming tracks on track change:', error)
				// }
			} else if (!isUndefined(index) && index !== -1) {
				newIndex = index
				console.debug(`Active track changed to index ${index}`)
			} else {
				console.warn('No index found for active track')
			}
		} else if (!isUndefined(index) && index !== -1) {
			newIndex = index
			console.debug(`Active track changed to index ${index}`)
		} else {
			console.warn('No active track found')
		}

		if (newIndex !== -1) {
			setCurrentIndex(newIndex)
		}
	})

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
		play: boolean = false,
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

		setQueueRef(queuingRef)

		setPlayQueue(queue)
		await TrackPlayer.setQueue(queue)
		await TrackPlayer.skip(finalStartIndex)

		setTimeout(() => setSkipping(false), 100)

		console.debug(
			`Queued ${queue.length} tracks, starting at ${finalStartIndex}${shuffleQueue ? ' (shuffled)' : ''}`,
		)

		if (play) await TrackPlayer.play()
	}

	/**
	 * Inserts a track at the next index in the queue
	 *
	 * Keeps a copy of the original queue in {@link unshuffledQueue}
	 *
	 * @param item The track to play next
	 */
	const playNextInQueue = async (item: BaseItemDto) => {
		console.debug(`Playing item next in queue`)

		const playNextTrack = mapDtoToTrack(
			api!,
			sessionId,
			item,
			downloadedTracks ?? [],
			QueuingType.PlayingNext,
			downloadQuality,
			streamingQuality,
		)

		// Update app state first to prevent race conditions
		const newQueue = [
			...playQueue.slice(0, currentIndex + 1),
			playNextTrack,
			...playQueue.slice(currentIndex + 1),
		]
		setPlayQueue(newQueue)

		// Then update RNTP
		await TrackPlayer.add([playNextTrack], currentIndex + 1)

		const nowPlaying = playQueue[currentIndex]

		// Add to the state unshuffled queue, using the currently playing track as the index
		setUnshuffledQueue([
			...unshuffledQueue.slice(0, unshuffledQueue.indexOf(nowPlaying) + 1),
			playNextTrack,
			...unshuffledQueue.slice(unshuffledQueue.indexOf(nowPlaying) + 1),
		])

		// Show a toast
		Toast.show({
			text1: 'Playing next',
			type: 'success',
		})
	}

	const playInQueue = async (items: BaseItemDto[]) => {
		const insertIndex = await findPlayQueueIndexStart(playQueue)
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

	const previousTrack = async () => {
		trigger('impactMedium')

		const { position } = await TrackPlayer.getProgress()

		console.debug(
			`Skip to previous triggered. Index is ${currentIndex}, position is ${position}`,
		)

		if (currentIndex > 0 && Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) {
			TrackPlayer.skipToPrevious()
		} else await TrackPlayer.seekTo(0)
	}

	const skipTrack = async (index?: number | undefined) => {
		trigger('impactMedium')

		console.debug(
			`Skip to next triggered. Index is ${`using ${
				!isUndefined(index) ? index : currentIndex
			} as index ${!isUndefined(index) ? 'since it was provided' : ''}`}`,
		)

		if (!isUndefined(index)) {
			const track = playQueue[index]
			const queue = await TrackPlayer.getQueue()
			const queueIndex = queue.findIndex((t) => t.item.Id === track.item.Id)

			if (queueIndex !== -1) {
				// Track found in TrackPlayer queue, skip to it
				await TrackPlayer.skip(queueIndex)
			} else {
				// Track not found - ensure upcoming tracks are properly ordered
				console.debug('Track not found in TrackPlayer queue, updating upcoming tracks')
				try {
					const { ensureUpcomingTracksInQueue } = await import(
						'../../player/helpers/gapless'
					)
					await ensureUpcomingTracksInQueue(playQueue, currentIndex)

					// Now try to find the track again
					const updatedQueue = await TrackPlayer.getQueue()
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
	}
	//#endregion Functions

	//#region Hooks
	const { mutate: addToQueue } = useMutation({
		mutationFn: ({ track, queuingType }: AddToQueueMutation) => {
			return queuingType === QueuingType.PlayingNext
				? playNextInQueue(track)
				: playInQueue([track])
		},
		onSuccess: (data, { queuingType }) => {
			trigger('notificationSuccess')

			// Burnt.alert({
			// 	title: queuingType === QueuingType.PlayingNext ? 'Playing next' : 'Added to queue',
			// 	duration: 0.5,
			// 	preset: 'done',
			// })
			Toast.show({
				text1: queuingType === QueuingType.PlayingNext ? 'Playing next' : 'Added to queue',
				type: 'success',
			})
		},
		onError: () => {
			trigger('notificationError')
		},
	})

	const { mutate: loadNewQueue } = useMutation({
		mutationFn: async ({
			index,
			track,
			tracklist,
			queuingType,
			queue,
			shuffled,
			play,
		}: QueueMutation) => loadQueue(tracklist, queue, index, shuffled, play),
		onSuccess: async (data, { queue }: QueueMutation) => {
			trigger('notificationSuccess')

			if (typeof queue === 'object' && api && user) await markItemPlayed(api, user, queue)
		},
	})

	const { mutate: removeFromQueue } = useMutation({
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
	})

	/**
	 *
	 */
	const { mutate: removeUpcomingTracks } = useMutation({
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
	})

	const { mutate: reorderQueue } = useMutation({
		mutationFn: async ({ from, to }: QueueOrderMutation) => {
			console.debug(`Moving track from ${from} to ${to}`)

			console.time('reorderQueue')

			console.time('setState')
			// Get the currently playing track so we can update the current index
			const currentlyPlayingTrack = playQueue[currentIndex]

			// Update app state first to prevent race conditions
			const newQueue = move(playQueue, from, to)
			setPlayQueue(newQueue)

			console.timeEnd('setState')

			// Update current index
			// This might not work if the same track is in the queue multiple
			// times
			setCurrentIndex(
				newQueue.findIndex((track) => track.item.Id === currentlyPlayingTrack.item.Id),
			)

			// Then update RNTP
			console.time('TrackPlayer.move')
			TrackPlayer.move(from, to)
			console.timeEnd('TrackPlayer.move')

			console.timeEnd('reorderQueue')
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
	})

	const { mutate: skip, isPending: skipPending } = useMutation({
		mutationFn: skipTrack,
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

	const { mutate: previous, isPending: previousPending } = useMutation({
		mutationFn: previousTrack,
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
	return {
		queueRef,
		playQueue,
		setPlayQueue,
		currentIndex,
		setCurrentIndex,
		skipping,
		fetchQueueSectionData,
		loadQueue,
		addToQueue,
		loadNewQueue,
		removeFromQueue,
		removeUpcomingTracks,
		reorderQueue,
		skip,
		skipPending,
		previous: previousTrack,
		previousPending,
		shuffled,
		setShuffled,
		unshuffledQueue,
		setUnshuffledQueue,
		resetQueue,
	}
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
	addToQueue: () => {},
	loadNewQueue: () => {},
	skip: () => {},
	skipPending: false,
	previous: () => {},
	previousPending: false,
	removeFromQueue: () => {},
	removeUpcomingTracks: () => {},
	reorderQueue: () => {},
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
	const performanceMetrics = usePerformanceMonitor('QueueProvider', 5)

	const context = useQueueContextInitializer()

	// Memoize the context value to prevent unnecessary re-renders
	const value = useMemo(
		() => context,
		[
			context.currentIndex,
			context.playQueue,
			context.queueRef,
			context.shuffled,
			context.skipping,
			context.unshuffledQueue.length,
			// Functions are stable since they're defined inside the initializer
			// Arrays are memoized by length to avoid reference changes
		],
	)

	return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
}

export const useQueueContext = () => useContext(QueueContext)
