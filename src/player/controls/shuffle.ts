import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from '../utils/shuffle'
import { isUndefined } from 'lodash'
import { setNewQueue, usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { useStreamingDeviceProfileStore } from '../../stores/profile'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import useLibraryStore from '../../stores/library'
import { getIsFavoriteFromCache } from '../../api/queries/user-data/cache'
import {
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
} from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../configs/querying/index.config'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { ShuffleResult } from '../interfaces'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import LoggingContext from '../../utils/logging/enums'
import { applyHapticFeedback } from '../../utils/haptics'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { handleError } from '../../utils/errors'

export const toggleShuffle = async () => {
	const { shuffled } = usePlayerQueueStore.getState()

	// Flip the icon before the native work so it responds instantly, regardless of queue length
	usePlayerQueueStore.setState({ shuffled: !shuffled })
	applyHapticFeedback('info')

	const result = shuffled ? await handleDeshuffle() : await handleShuffle()

	// Roll back if the native queue couldn't be updated
	if (!result) usePlayerQueueStore.setState({ shuffled })
}

export async function handleLibraryShuffle() {
	try {
		const api = getApi()
		const user = getUser()
		const library = getLibrary()
		const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile

		if (!api || !user || !deviceProfile) {
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
					filteredDownloads = filteredDownloads.filter((download) =>
						getIsFavoriteFromCache(getTrackDto(download.originalTrack)),
					)
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
				const { data } = await getLibraryApi(api).getItems({
					parentId: library?.musicLibraryId,
					userId: user.id,
					includeItemTypes: [BaseItemKind.Audio],
					recursive: true,
					sortBy: [ItemSortBy.Random],
					filters: apiFilters.length > 0 ? apiFilters : undefined,
					genreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
					years: yearsParam,
					limit: ApiLimits.LibraryShuffle,
					enableUserData: true,
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
				setNewQueue(finalQueue, 'Library Shuffle', startIndex, true)

				return { currentIndex: startIndex, queue: finalQueue }
			}
		}
	} catch (error) {
		handleError(error, LoggingContext.NitroFetch, 'Failed to fetch random tracks')
	}
}

export async function handleShuffle(): Promise<ShuffleResult | undefined> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const { currentIndex, queue: playQueue } = usePlayerQueueStore.getState()

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

	let updatedQueue: TrackItem[]

	// Shuffle natively in a single pass - keeps the playing track at index 0 without interrupting it
	try {
		await PlayerQueue.shufflePlaylist(playlistId, { keepCurrentTrackFirst: true })

		const tracks = PlayerQueue.getPlaylist(playlistId)?.tracks

		if (!tracks) throw new Error(`Playlist ${playlistId} not found after shuffling`)

		updatedQueue = tracks
	} catch (error) {
		handleError(error, LoggingContext.NitroFetch, 'Failed to shuffle queue')
		return undefined
	}

	const updatedCurrentIndex = 0

	// Update store
	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex: updatedCurrentIndex,
		queue: updatedQueue,
		unShuffledQueue: [...playQueue],
	}))

	return {
		currentIndex: updatedCurrentIndex,
		queue: updatedQueue,
	}
}

export async function handleDeshuffle(): Promise<ShuffleResult | undefined> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const { currentIndex, unShuffledQueue, queue: playQueue } = usePlayerQueueStore.getState()

	const currentTrack = !isUndefined(currentIndex) ? playQueue[currentIndex] : undefined

	// Don't deshuffle if no unshuffled queue stored
	if (!unShuffledQueue || unShuffledQueue.length === 0 || !playlistId || !currentTrack) {
		return { currentIndex: currentIndex ?? 0, queue: playQueue }
	}

	// Find where the currently playing track belongs in the original queue.
	const newCurrentIndex = unShuffledQueue.findIndex((track) => track.id === currentTrack.id)

	if (newCurrentIndex < 0) {
		return { currentIndex: currentIndex ?? 0, queue: playQueue }
	}

	const prevUnshuffledItems = unShuffledQueue.slice(0, newCurrentIndex)
	const nextUnshuffledItems = unShuffledQueue.slice(newCurrentIndex + 1)

	// Remove all tracks except the current track from the current playlist in one native pass.
	// Removal is by id, so the current track's id is excluded to keep the playing copy.
	try {
		const idsToRemove = [
			...new Set(playQueue.map(({ id }) => id).filter((id) => id !== currentTrack.id)),
		]

		if (idsToRemove.length > 0) {
			await PlayerQueue.removeTracksFromPlaylist(playlistId, idsToRemove)
		}

		if (prevUnshuffledItems.length > 0) {
			await PlayerQueue.addTracksToPlaylist(playlistId, prevUnshuffledItems, 0)
		}

		if (nextUnshuffledItems.length > 0) {
			await PlayerQueue.addTracksToPlaylist(playlistId, nextUnshuffledItems)
		}
	} catch (error) {
		handleError(error, LoggingContext.NitroFetch, 'Failed to unshuffle queue')
		return undefined
	}

	const updatedQueue = unShuffledQueue
	const updatedCurrentIndex = newCurrentIndex

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: updatedQueue,
		unShuffledQueue: [],
		currentIndex: updatedCurrentIndex,
	}))

	return {
		currentIndex: updatedCurrentIndex,
		queue: updatedQueue,
	}
}
