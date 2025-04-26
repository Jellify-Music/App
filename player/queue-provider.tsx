import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { createContext } from 'react'
import { Queue } from './types/queue-item'
import { Section } from '../components/Player/types'
import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from './interfaces'
import { storage } from '../constants/storage'
import { MMKVStorageKeys } from '../enums/mmkv-storage-keys'
import { JellifyTrack } from '../types/JellifyTrack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../helpers/mappings'
import { useNetworkContext } from '../components/Network/provider'
import { QueuingType } from '../enums/queuing-type'
import TrackPlayer from 'react-native-track-player'
import { findPlayQueueIndexStart } from './helpers'
import { getQueue, seekTo } from 'react-native-track-player/lib/src/trackPlayer'
import { trigger } from 'react-native-haptic-feedback'
import * as Burnt from 'burnt'
import { markItemPlayed } from '../api/mutations/functions/item'
import { filterTracksOnNetworkStatus } from './helpers/queue'
import { SKIP_TO_PREVIOUS_THRESHOLD } from './config'

interface QueueContext {
	queueRef: Queue
	playQueue: JellifyTrack[]
	currentIndex: number
	fetchQueueSectionData: () => Section[]
	useAddToQueue: UseMutationResult<void, Error, AddToQueueMutation, unknown>
	useLoadNewQueue: UseMutationResult<void, Error, QueueMutation, unknown>
	useRemoveUpcomingTracks: UseMutationResult<void, Error, void, unknown>
	useRemoveFromQueue: UseMutationResult<void, Error, number, unknown>
	useReorderQueue: UseMutationResult<void, Error, QueueOrderMutation, unknown>
	useSkip: UseMutationResult<void, Error, number | undefined, unknown>
	usePrevious: UseMutationResult<void, Error, void, unknown>
}

const QueueContextInitailizer = () => {
	const queueRefJson = storage.getString(MMKVStorageKeys.Queue)
	const playQueueJson = storage.getString(MMKVStorageKeys.PlayQueue)

	const queueRefInit = queueRefJson ? JSON.parse(queueRefJson) : 'Recently Played'
	const playQueueInit = playQueueJson ? JSON.parse(playQueueJson) : []

	const [queueRef, setQueueRef] = useState<Queue>(queueRefInit)
	const [playQueue, setPlayQueue] = useState<JellifyTrack[]>(playQueueInit)

	const [updateRntp, setUpdateRntp] = useState<boolean>(true)

	const [currentIndex, setCurrentIndex] = useState<number>(-1)

	const { downloadedTracks, networkStatus } = useNetworkContext()

	//#region Functions
	const fetchQueueSectionData: () => Section[] = () => {
		return Object.keys(QueuingType).map((type) => {
			return {
				title: type,
				data: playQueue.filter((track) => track.QueuingType === type),
			} as Section
		})
	}

	const resetQueue = () => {
		console.debug(`Clearing queue of ${playQueue.length}`)
		setPlayQueue([])
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
					mapDtoToTrack(track, downloadedTracks ?? [], queueItem.QueuingType),
					queueItemIndex,
				)
			})
		}
	}

	const loadQueue = async (
		audioItems: BaseItemDto[],
		queuingRef: Queue,
		startIndex: number = 1,
	) => {
		console.debug(`Queuing ${audioItems.length} items`)

		const availableAudioItems = filterTracksOnNetworkStatus(
			networkStatus,
			audioItems,
			downloadedTracks ?? [],
		)

		console.debug(
			`Filtered out ${
				audioItems.length - availableAudioItems.length
			} due to network status being ${networkStatus}`,
		)

		const queue = availableAudioItems.map((item) =>
			mapDtoToTrack(item, downloadedTracks ?? [], QueuingType.FromSelection),
		)

		setPlayQueue(queue)
		setQueueRef(queuingRef)
		setCurrentIndex(startIndex)

		console.debug(`Queued ${queue.length} tracks, starting at ${startIndex}`)
	}

	const playNextInQueue = async (item: BaseItemDto) => {
		console.debug(`Playing item next in queue`)

		const playNextTrack = mapDtoToTrack(item, downloadedTracks ?? [], QueuingType.PlayingNext)

		setUpdateRntp(false)
		setPlayQueue([
			...playQueue.slice(0, currentIndex),
			playNextTrack,
			...playQueue.slice(currentIndex + 1, playQueue.length - 1),
		])

		TrackPlayer.add([playNextTrack], currentIndex + 1)
	}

	const playInQueue = async (items: BaseItemDto[]) => {
		const insertIndex = await findPlayQueueIndexStart(playQueue)
		console.debug(`Adding ${items.length} to queue at index ${insertIndex}`)

		setUpdateRntp(false)
		await TrackPlayer.add(
			items.map((item) =>
				mapDtoToTrack(item, downloadedTracks ?? [], QueuingType.DirectlyQueued),
			),
			insertIndex,
		)

		setPlayQueue((await getQueue()) as JellifyTrack[])

		console.debug(`Queue has ${playQueue.length} tracks`)
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

			Burnt.alert({
				title: queuingType === QueuingType.PlayingNext ? 'Playing next' : 'Added to queue',
				duration: 0.5,
				preset: 'done',
			})
		},
		onError: () => {
			trigger('notificationError')
		},
	})

	const useLoadNewQueue = useMutation({
		mutationFn: async ({ index, track, tracklist, queuingType, queue }: QueueMutation) =>
			loadQueue(tracklist, queue, index),
		onSuccess: async (data, { queue }: QueueMutation) => {
			trigger('notificationSuccess')

			if (typeof queue === 'object') await markItemPlayed(queue)
		},
	})

	const useRemoveFromQueue = useMutation({
		mutationFn: async (index: number) => {
			trigger('impactMedium')

			setUpdateRntp(false)
			TrackPlayer.remove([index])
			setPlayQueue([
				...playQueue.slice(0, index),
				...playQueue.slice(index + 1, playQueue.length - 1),
			])
		},
	})

	/**
	 *
	 */
	const useRemoveUpcomingTracks = useMutation({
		mutationFn: async () => {
			setUpdateRntp(false)
			TrackPlayer.removeUpcomingTracks()
			setPlayQueue([...playQueue.slice(0, currentIndex + 1)])
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
	})

	const useReorderQueue = useMutation({
		mutationFn: async ({ from, to, newOrder }: QueueOrderMutation) => {
			setUpdateRntp(false)
			TrackPlayer.move(from, to)
			setPlayQueue(newOrder)
		},
		onSuccess: () => {
			trigger('notificationSuccess')
		},
	})

	const useSkip = useMutation({
		mutationFn: async (index?: number | undefined) => {
			trigger('impactMedium')

			console.debug(
				`Skip to next triggered. Index is ${`using ${
					index ? index : currentIndex
				} as index ${index ? 'since it was provided' : ''}`}`,
			)

			if (index && index < playQueue.length - 1) setCurrentIndex(index)
			else if (playQueue.length - 1 > currentIndex) setCurrentIndex(currentIndex + 1)
		},
	})

	const usePrevious = useMutation({
		mutationFn: async () => {
			trigger('impactMedium')

			const { position } = await TrackPlayer.getProgress()

			console.debug(`Skip to previous triggered. Index is ${currentIndex}`)

			if (currentIndex > 0 && position < SKIP_TO_PREVIOUS_THRESHOLD) {
				setCurrentIndex(currentIndex - 1)
			} else await seekTo(0)
		},
	})

	const useUpdateRntpQueue = useMutation({
		mutationFn: async () => {
			if (updateRntp) await TrackPlayer.setQueue(playQueue)

			setUpdateRntp(true)
		},
	})

	const useUpdateRntpIndex = useMutation({
		mutationFn: async (index: number) => {
			await TrackPlayer.skip(index)
		},
	})

	//#endregion Hooks

	//#region useEffect(s)
	/**
	 * Update RNTP Queue when our queue
	 * is updated
	 */
	useEffect(() => {
		useUpdateRntpQueue.mutate()
		storage.set(MMKVStorageKeys.PlayQueue, JSON.stringify(playQueue))
	}, [playQueue])

	useEffect(() => {
		storage.set(MMKVStorageKeys.Queue, JSON.stringify(queueRef))
	}, [queueRef])

	useEffect(() => {
		useUpdateRntpIndex.mutate(currentIndex)
	}, [currentIndex])

	//#endregion useEffect(s)

	return {
		queueRef,
		playQueue,
		currentIndex,
		setCurrentIndex,
		fetchQueueSectionData,
		useAddToQueue,
		useLoadNewQueue,
		useRemoveFromQueue,
		useRemoveUpcomingTracks,
		useReorderQueue,
		useSkip,
		usePrevious,
	}
}

export const QueueContext = createContext<QueueContext>({
	queueRef: 'Recently Played',
	playQueue: [],
	currentIndex: -1,
	fetchQueueSectionData: () => [],
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
