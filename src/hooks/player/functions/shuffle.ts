import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import { isUndefined } from 'lodash'
import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
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
import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { triggerHaptic } from '../../use-haptic-feedback'
import { ShuffleResult } from '../interfaces'

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

			if (isDownloaded) {
				// For downloaded tracks, get from cache and filter client-side
				const downloadedTracks = await DownloadManager.getAllDownloadedTracks()

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
					randomTracks = await Promise.all(data.Items.map((item) => mapDtoToTrack(item)))
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
		console.error('Failed to fetch random tracks:', error)
		Toast.show({
			text1: 'Failed to fetch random tracks',
			type: 'error',
		})
	}
}

export async function handleShuffle(): Promise<ShuffleResult> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const { currentIndex, queue: playQueue } = usePlayerQueueStore.getState()

	const currentTrack = playQueue[currentIndex ?? 0]

	// Don't shuffle if queue is empty or has only one track
	if (
		!playQueue ||
		playQueue.length <= 1 ||
		isUndefined(currentIndex) ||
		!currentTrack ||
		!playlistId
	) {
		return { currentIndex: 0, queue: [] }
	}

	// Regular shuffle logic - requires a queue and current track
	if (!playQueue || playQueue.length <= 1) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return { currentIndex: 0, queue: [] }
	}

	if (isUndefined(currentIndex) || !currentTrack) {
		Toast.show({
			text1: 'No track currently playing',
			type: 'info',
		})
		return { currentIndex: 0, queue: [] }
	}

	// Save off unshuffledQueue
	usePlayerQueueStore.getState().setUnshuffledQueue([...playQueue])

	const otherTracks = playQueue.filter((_, i) => i !== currentIndex)
	const { shuffled: newShuffledQueue } = shuffleJellifyTracks(otherTracks)

	// Remove the other tracks from the player queue
	otherTracks.forEach(({ id }) => PlayerQueue.removeTrackFromPlaylist(playlistId!, id))

	// Add the shuffled tracks after the current track
	PlayerQueue.addTracksToPlaylist(playlistId!, newShuffledQueue, 1)

	// Present a clean queue to the JS store (current track first, then shuffled upcoming).
	return { currentIndex: 0, queue: [currentTrack, ...newShuffledQueue] }
}

export async function handleDeshuffle(): Promise<ShuffleResult> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const {
		currentIndex,
		shuffled,
		unShuffledQueue,
		queue: playQueue,
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
		return { currentIndex: 0, queue: playQueue }
	}

	// Find where the currently playing track belongs in the original queue.
	const newCurrentIndex = unShuffledQueue.findIndex((track) => track.id === currentTrack.id)

	// TODO: If the current track isn't found in the original queue, we could either:
	// 1) Keep the current track and just append the original queue (minus the current track) after it
	// 2) Or treat it as an edge case and just don't deshuffle (keep the shuffled queue as is)

	const prevUnshuffledItems = unShuffledQueue.slice(0, newCurrentIndex)
	const nextUnshuffledItems = unShuffledQueue.slice(newCurrentIndex + 1)
	const originalUpcoming = [...prevUnshuffledItems, ...nextUnshuffledItems]

	// Remove all tracks except the current track from the current playlist
	playQueue.forEach(async ({ id }) => {
		if (id !== currentTrack.id) {
			await PlayerQueue.removeTrackFromPlaylist(playlistId!, id)
		}
	})

	// Remove the shuffled tracks that are after the current track.
	originalUpcoming.forEach(async ({ id }) => {
		if (id !== currentTrack.id) {
			await PlayerQueue.removeTrackFromPlaylist(playlistId, id)
		}
	})

	// Add the original upcoming tracks right after currentTrack's native position.
	if (prevUnshuffledItems.length > 0) {
		await PlayerQueue.addTracksToPlaylist(playlistId, prevUnshuffledItems, 0)
	}

	if (nextUnshuffledItems.length > 0) {
		await PlayerQueue.addTracksToPlaylist(playlistId, nextUnshuffledItems, newCurrentIndex + 1)
	}

	usePlayerQueueStore.getState().setUnshuffledQueue([])

	return { currentIndex: newCurrentIndex, queue: unShuffledQueue }
}
