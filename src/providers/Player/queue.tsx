import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { createContext } from 'react'
import { Queue } from '../../player/types/queue-item'
import { Section } from '../../components/Player/types'
import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from '../../player/interfaces'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import JellifyTrack from '../../types/JellifyTrack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../helpers/mappings'
import { useNetworkContext } from '../Network'
import { useSettingsContext } from '../Settings'
import { QueuingType } from '../../enums/queuing-type'
import TrackPlayer, { Event, useTrackPlayerEvents } from 'react-native-track-player'
import { findPlayQueueIndexStart } from './utils'
import { play, seekTo } from 'react-native-track-player/lib/src/trackPlayer'
import { trigger } from 'react-native-haptic-feedback'

import { markItemPlayed } from '../../api/mutations/item'
import { filterTracksOnNetworkStatus } from './utils/queue'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../player/config'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '..'
import { networkStatusTypes } from '@/src/components/Network/internetConnectionWatcher'

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
	useLoadNewQueue: UseMutationResult<void, Error, QueueMutation, unknown>

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
	useReorderQueue: UseMutationResult<void, Error, QueueOrderMutation, unknown>

	/**
	 * A hook that skips to the next track
	 */
	useSkip: UseMutationResult<void, Error, number | undefined, unknown>

	/**
	 * A hook that skips to the previous track
	 */
	usePrevious: UseMutationResult<void, Error, void, unknown>

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

	const [currentIndex, setCurrentIndex] = useState<number>(
		!isUndefined(currentIndexValue) ? currentIndexValue : -1,
	)

	const [skipping, setSkipping] = useState<boolean>(false)

	const [shuffled, setShuffled] = useState<boolean>(shuffledInit ?? false)

	//#endregion State

	//#region Context
	const { api, sessionId, user } = useJellifyContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()
	const { downloadQuality } = useSettingsContext()

	//#endregion Context

	useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], ({ track }) => {
		console.debug('Active track changed')
		if (!isUndefined(track)) {
			const index = playQueue.findIndex((t) => t.item.Id === track.item.Id)
			if (!isUndefined(index)) {
				setCurrentIndex(index)
				console.debug(`Active track changed to index ${index}`)
			} else console.warn('No index found for active track')
		} else console.warn('No active track found')
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

			TrackPlayer.remove([queueItemIndex]).then(() => {
				TrackPlayer.add(
					mapDtoToTrack(
						api!,
						sessionId,
						track,
						downloadedTracks ?? [],
						queueItem.QueuingType,
						downloadQuality,
					),
					queueItemIndex,
				)
			})
		}
	}

	const loadQueue = async (
		audioItems: BaseItemDto[],
		queuingRef: Queue,
		startIndex: number = 0,
		shuffled: boolean = false,
	) => {
		trigger('impactLight')
		console.debug(`Queuing ${audioItems.length} items`)

		setSkipping(true)
		setShuffled(shuffled)

		// Get the item at the start index
		const startingTrack = audioItems[startIndex]

		const availableAudioItems = filterTracksOnNetworkStatus(
			networkStatus as networkStatusTypes,
			audioItems,
			downloadedTracks ?? [],
		)

		// The start index may have changed due to the filtered out items
		const filteredStartIndex = availableAudioItems.findIndex(
			(item) => item.Id === startingTrack.Id,
		)

		console.debug(
			`Filtered out ${
				audioItems.length - availableAudioItems.length
			} due to network status being ${networkStatus}`,
		)

		console.debug(`Filtered start index is ${filteredStartIndex}`)

		const queue = availableAudioItems.map((item) =>
			mapDtoToTrack(
				api!,
				sessionId,
				item,
				downloadedTracks ?? [],
				QueuingType.FromSelection,
				downloadQuality,
			),
		)

		setQueueRef(queuingRef)

		await TrackPlayer.setQueue(queue)
		setPlayQueue(queue)
		setUnshuffledQueue(queue)
		await TrackPlayer.skip(filteredStartIndex)

		setSkipping(false)

		console.debug(`Queued ${queue.length} tracks, starting at ${filteredStartIndex}`)

		await play()
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
		)

		TrackPlayer.add([playNextTrack], currentIndex + 1)

		// Add to the state play queue
		setPlayQueue(playQueue.splice(currentIndex + 1, 0, playNextTrack))

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

		await TrackPlayer.add(
			items.map((item) =>
				mapDtoToTrack(
					api!,
					sessionId,
					item,
					downloadedTracks ?? [],
					QueuingType.DirectlyQueued,
					downloadQuality,
				),
			),
			insertIndex,
		)

		setPlayQueue(
			playQueue.splice(
				insertIndex,
				0,
				...items.map((item) =>
					mapDtoToTrack(
						api!,
						sessionId,
						item,
						downloadedTracks ?? [],
						QueuingType.DirectlyQueued,
						downloadQuality,
					),
				),
			),
		)

		if (shuffled) {
			setUnshuffledQueue([
				...unshuffledQueue,
				...items.map((item) =>
					mapDtoToTrack(
						api!,
						sessionId,
						item,
						downloadedTracks ?? [],
						QueuingType.DirectlyQueued,
						downloadQuality,
					),
				),
			])
		} else {
			setUnshuffledQueue([
				...unshuffledQueue,
				...items.map((item) =>
					mapDtoToTrack(
						api!,
						sessionId,
						item,
						downloadedTracks ?? [],
						QueuingType.DirectlyQueued,
						downloadQuality,
					),
				),
			])
		}

		console.debug(`Queue has ${playQueue.length} tracks`)
	}

	const previous = async () => {
		trigger('impactMedium')

		const { position } = await TrackPlayer.getProgress()

		console.debug(
			`Skip to previous triggered. Index is ${currentIndex}, position is ${position}`,
		)

		if (currentIndex > 0 && Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) {
			TrackPlayer.skipToPrevious()
		} else await seekTo(0)
	}

	const skip = async (index?: number | undefined) => {
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
			if (!isUndefined(queueIndex)) TrackPlayer.skip(queueIndex)
			else console.warn('No index found for active track')
		} else TrackPlayer.skipToNext()
	}
	//#endregion Functions

	//#region Hooks
	const useAddToQueue = useMutation({
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

	const useLoadNewQueue = useMutation({
		mutationFn: async ({
			index,
			track,
			tracklist,
			queuingType,
			queue,
			shuffled,
		}: QueueMutation) => loadQueue(tracklist, queue, index, shuffled),
		onSuccess: async (data, { queue }: QueueMutation) => {
			trigger('notificationSuccess')

			if (typeof queue === 'object' && api && user) await markItemPlayed(api, user, queue)
		},
	})

	const useRemoveFromQueue = useMutation({
		mutationFn: async (index: number) => {
			trigger('impactMedium')

			TrackPlayer.remove([index])
			const trackPlayerQueue = await TrackPlayer.getQueue()
			setPlayQueue(trackPlayerQueue as JellifyTrack[])
			setUnshuffledQueue(trackPlayerQueue as JellifyTrack[])
		},
	})

	/**
	 *
	 */
	const useRemoveUpcomingTracks = useMutation({
		mutationFn: async () => {
			TrackPlayer.removeUpcomingTracks()
			const trackPlayerQueue = await TrackPlayer.getQueue()
			setPlayQueue(trackPlayerQueue as JellifyTrack[])
			setUnshuffledQueue(trackPlayerQueue as JellifyTrack[])
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
	})

	const useReorderQueue = useMutation({
		mutationFn: async ({ from, to, newOrder }: QueueOrderMutation) => {
			TrackPlayer.move(from, to)
			const trackPlayerQueue = await TrackPlayer.getQueue()
			setPlayQueue(trackPlayerQueue as JellifyTrack[])
			setUnshuffledQueue(trackPlayerQueue as JellifyTrack[])
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
	})

	const useSkip = useMutation({
		mutationFn: skip,
	})

	const usePrevious = useMutation({
		mutationFn: previous,
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
	useLoadNewQueue: {
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
	useSkip: {
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
	usePrevious: {
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
	useReorderQueue: {
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
	shuffled: false,
	setShuffled: () => {},
	unshuffledQueue: [],
})

export const QueueProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	const context = QueueContextInitailizer()

	return <QueueContext.Provider value={context}>{children}</QueueContext.Provider>
}

export const useQueueContext = () => useContext(QueueContext)
