import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import { isUndefined } from 'lodash'
import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { getApi, getLibrary, getUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../../../api/queries/user-data/keys'
import {
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../../configs/query.config'
import { mapDtosToTracks } from '../../../utils/mapping/item-to-track'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { triggerHaptic } from '../../use-haptic-feedback'
import { ShuffleResult } from '../interfaces'
import { ensureDownloadedTracks } from '../../downloads/utils'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'

export const toggleShuffle = async () => {
	const { shuffled } = usePlayerQueueStore.getState()

	triggerHaptic('impactMedium')

	let result: ShuffleResult | undefined

	if (shuffled) result = await handleDeshuffle()
	else result = await handleShuffle()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: result.queue,
		currentIndex: result.currentIndex,
		shuffled: !shuffled,
	}))
}

export async function handleLibraryShuffle() {
	try {
		const api = getApi()
		const user = getUser()
		const library = getLibrary()
		const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile

		if (!api || !user || !library || !deviceProfile) {
			Toast.show({
				text1: 'Unable to fetch random tracks',
				type: 'error',
			})
		} else {
			// Get current filters from the store
			const filters = useLibraryStore.getState().filters.tracks
			const isFavorites = filters.isFavorites === true
			const isDownloaded = filters.isDownloaded === true
			const isUnplayed = filters.isUnplayed === true
			const genreIds = filters.genreIds
			const yearMin = filters.yearMin
			const yearMax = filters.yearMax

			let randomTracks: TrackItem[] = []
			// For downloaded tracks, get from cache and filter client-side
			const downloadedTracks = await ensureDownloadedTracks()

			if (isDownloaded) {
				if (!downloadedTracks || downloadedTracks.length === 0) {
					Toast.show({
						text1: 'No downloaded tracks available',
						type: 'info',
					})
					return { currentIndex: 0, queue: [] }
				}

				// Filter downloaded tracks
				let filteredDownloads = downloadedTracks

				// Filter by year range
				if (yearMin != null || yearMax != null) {
					const min = yearMin ?? 0
					const max = yearMax ?? new Date().getFullYear()
					filteredDownloads = filteredDownloads.filter((download) => {
						const y = getTrackDto(download.originalTrack)?.ProductionYear
						return y != null && y >= min && y <= max
					})
				}

				// Filter by favorites
				if (isFavorites) {
					filteredDownloads = filteredDownloads.filter((download) => {
						const userData = queryClient.getQueryData(
							UserDataQueryKey(user, download.originalTrack.id),
						) as UserItemDataDto | undefined
						return userData?.IsFavorite === true
					})
				}

				// Shuffle the filtered downloads using Fisher-Yates shuffle
				const shuffled = [...(filteredDownloads as unknown as TrackItem[])]
				for (let i = shuffled.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
				}
				shuffleJellifyTracks(shuffled)

				// Limit to ApiLimits.LibraryShuffle and use as tracks
				randomTracks = shuffled.slice(0, ApiLimits.LibraryShuffle)
			} else {
				// For non-downloaded tracks, use API with filters
				// Build filters array based on isFavorite and isUnplayed
				const apiFilters: ItemFilter[] = []
				if (isFavorites) {
					apiFilters.push(ItemFilter.IsFavorite)
				}
				if (isUnplayed) {
					apiFilters.push(ItemFilter.IsUnplayed)
				}

				// Build years param for year range filter
				const yearsParam =
					yearMin != null || yearMax != null
						? (() => {
								const min = yearMin ?? 0
								const max = yearMax ?? new Date().getFullYear()
								if (min > max) return undefined
								const years: number[] = []
								for (let y = min; y <= max; y++) years.push(y)
								return years.length > 0 ? years : undefined
							})()
						: undefined

				// Fetch random tracks from Jellyfin with filters
				const { data } = await getItemsApi(api).getItems({
					parentId: library.musicLibraryId,
					userId: user.id,
					includeItemTypes: [BaseItemKind.Audio],
					recursive: true,
					sortBy: [ItemSortBy.Random],
					filters: apiFilters.length > 0 ? apiFilters : undefined,
					genreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
					years: yearsParam,
					limit: ApiLimits.LibraryShuffle,
					fields: [
						ItemFields.MediaSources,
						ItemFields.ParentId,
						ItemFields.Path,
						ItemFields.SortName,
						ItemFields.Chapters,
					],
				})

				if (data.Items && data.Items.length > 0) {
					// Map BaseItemDto[] to JellifyTrack[]
					randomTracks = mapDtosToTracks(data.Items, downloadedTracks)
				}
			}

			if (randomTracks && randomTracks.length > 0) {
				const startIndex: number = 0
				const finalQueue: TrackItem[] = randomTracks

				if (finalQueue.length === 0) {
					Toast.show({ text1: 'No tracks to shuffle', type: 'info' })
					return { currentIndex: 0, queue: [] }
				}

				// Save off unshuffledQueue (the new random queue)
				usePlayerQueueStore.getState().setUnshuffledQueue([...finalQueue])

				// Replace the queue with random tracks
				const randomTrackPlaylistId = await PlayerQueue.createPlaylist('Library Shuffle')

				await PlayerQueue.addTracksToPlaylist(randomTrackPlaylistId, finalQueue)
				await PlayerQueue.loadPlaylist(randomTrackPlaylistId)

				if (startIndex > 0) {
					await TrackPlayer.skipToIndex(startIndex)
				}

				// Update state
				setNewQueue(finalQueue, 'Library', startIndex, true)

				return { currentIndex: startIndex, queue: finalQueue }
			}
		}
	} catch (error) {
		captureError(
			error,
			LoggingContext.NitroFetch,
			'Failed to fetch random tracks for library shuffle',
		)
		Toast.show({
			text1: 'Failed to fetch random tracks',
			type: 'error',
		})
	}
}

export async function handleShuffle(): Promise<ShuffleResult> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const { currentIndex, queue: playQueue, setIsQueuing } = usePlayerQueueStore.getState()

	const currentTrack = playQueue[currentIndex ?? 0]

	if (!playQueue || playQueue.length <= 1) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return { currentIndex: currentIndex ?? 0, queue: playQueue ?? [] }
	}

	if (isUndefined(currentIndex) || !currentTrack) {
		Toast.show({
			text1: 'No track currently playing',
			type: 'info',
		})
		return { currentIndex: currentIndex ?? 0, queue: playQueue }
	}

	if (!playlistId) {
		return { currentIndex, queue: playQueue }
	}

	const otherTracks = playQueue.filter((_, index) => index !== currentIndex)

	const { shuffled: newShuffledQueue } = shuffleJellifyTracks(otherTracks)

	setIsQueuing(true)

	// Apply player operations
	try {
		for (const { id } of otherTracks) {
			await PlayerQueue.removeTrackFromPlaylist(playlistId, id)
		}

		await PlayerQueue.addTracksToPlaylist(playlistId, newShuffledQueue)
	} finally {
		setIsQueuing(false)
	}

	const updatedQueue = await TrackPlayer.getActualQueue()
	const updatedCurrentIndex = updatedQueue.findIndex((track) => track.id === currentTrack.id)

	// Update store
	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex: updatedCurrentIndex === -1 ? 0 : updatedCurrentIndex,
		queue: updatedQueue,
		unShuffledQueue: [...playQueue],
	}))

	return {
		currentIndex: updatedCurrentIndex === -1 ? 0 : updatedCurrentIndex,
		queue: updatedQueue,
	}
}

export async function handleDeshuffle(): Promise<ShuffleResult> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const {
		currentIndex,
		shuffled,
		unShuffledQueue,
		queue: playQueue,
		setIsQueuing,
	} = usePlayerQueueStore.getState()

	const currentTrack = !isUndefined(currentIndex) ? playQueue[currentIndex] : undefined

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (
		!shuffled ||
		!unShuffledQueue ||
		unShuffledQueue.length === 0 ||
		!playlistId ||
		!currentTrack
	) {
		return { currentIndex: currentIndex ?? 0, queue: playQueue }
	}

	// Find where the currently playing track belongs in the original queue.
	const newCurrentIndex = unShuffledQueue.findIndex((track) => track.id === currentTrack.id)

	if (newCurrentIndex < 0) {
		return { currentIndex: currentIndex ?? 0, queue: playQueue }
	}

	const prevUnshuffledItems = unShuffledQueue.slice(0, newCurrentIndex)
	const nextUnshuffledItems = unShuffledQueue.slice(newCurrentIndex + 1)

	// Remove all tracks except the current track from the current playlist
	setIsQueuing(true)

	try {
		const tracksToRemove = playQueue.filter((_, index) => index !== currentIndex)
		for (const { id } of tracksToRemove) {
			await PlayerQueue.removeTrackFromPlaylist(playlistId, id)
		}

		if (prevUnshuffledItems.length > 0) {
			await PlayerQueue.addTracksToPlaylist(playlistId, prevUnshuffledItems, 0)
		}

		if (nextUnshuffledItems.length > 0) {
			await PlayerQueue.addTracksToPlaylist(playlistId, nextUnshuffledItems)
		}
	} finally {
		setIsQueuing(false)
	}

	const updatedQueue = await TrackPlayer.getActualQueue()
	const updatedCurrentIndex = updatedQueue.findIndex((track) => track.id === currentTrack.id)

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: updatedQueue,
		unShuffledQueue: [],
		currentIndex: updatedCurrentIndex === -1 ? newCurrentIndex : updatedCurrentIndex,
	}))

	return {
		currentIndex: updatedCurrentIndex === -1 ? newCurrentIndex : updatedCurrentIndex,
		queue: updatedQueue,
	}
}
