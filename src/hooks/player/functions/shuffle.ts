import JellifyTrack from '../../../types/JellifyTrack'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import { isUndefined } from 'lodash'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { getApi, getLibrary, getUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { queryClient } from '../../../constants/query-client'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { AUDIO_CACHE_QUERY } from '../../../api/queries/download/constants'
import UserDataQueryKey from '../../../api/queries/user-data/keys'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../../configs/query.config'
import { nitroFetch } from '../../../api/utils/nitro'
import { QueuingType } from '../../../enums/queuing-type'
import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'

export async function handleShuffle(): Promise<JellifyTrack[]> {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const currentIndex = usePlayerQueueStore.getState().currentIndex
	const currentTrack = usePlayerQueueStore.getState().currentTrack
	const playQueue = usePlayerQueueStore.getState().queue

	const queueRef = usePlayerQueueStore.getState().queueRef

	// Don't shuffle if queue is empty or has only one track
	if (
		!playQueue ||
		playQueue.length <= 1 ||
		isUndefined(currentIndex) ||
		!currentTrack ||
		!playlistId
	) {
		return []
	}

	const { currentPosition } = await TrackPlayer.getState()

	// Special handling for Library queue - fetch random tracks from Jellyfin
	// This works even when there's no current track
	if (queueRef === 'Library') {
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
				// Fall through to regular shuffle if there's a queue
				if (!playQueue || playQueue.length === 0) {
					return []
				}
			} else {
				// Get current filters from the store
				const filters = useLibraryStore.getState().filters.tracks
				const isFavorites = filters.isFavorites === true
				const isDownloaded = filters.isDownloaded === true
				const isUnplayed = filters.isUnplayed === true
				const genreIds = filters.genreIds
				const yearMin = filters.yearMin
				const yearMax = filters.yearMax

				let randomTracks: JellifyTrack[] = []

				if (isDownloaded) {
					// For downloaded tracks, get from cache and filter client-side
					const downloadedTracks = queryClient.getQueryData<JellifyDownload[]>(
						AUDIO_CACHE_QUERY.queryKey,
					)

					if (!downloadedTracks || downloadedTracks.length === 0) {
						Toast.show({
							text1: 'No downloaded tracks available',
							type: 'info',
						})
						return []
					}

					// Filter downloaded tracks
					let filteredDownloads = downloadedTracks

					// Filter by year range
					if (yearMin != null || yearMax != null) {
						const min = yearMin ?? 0
						const max = yearMax ?? new Date().getFullYear()
						filteredDownloads = filteredDownloads.filter((download) => {
							const y = download.item.ProductionYear
							return y != null && y >= min && y <= max
						})
					}

					// Filter by favorites
					if (isFavorites) {
						filteredDownloads = filteredDownloads.filter((download) => {
							const userData = queryClient.getQueryData(
								UserDataQueryKey(user, download.item),
							) as UserItemDataDto | undefined
							return userData?.IsFavorite === true
						})
					}

					// Shuffle the filtered downloads using Fisher-Yates shuffle
					const shuffled = [...(filteredDownloads as unknown as JellifyTrack[])]
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
									const years: string[] = []
									for (let y = min; y <= max; y++) years.push(String(y))
									return years.length > 0 ? years : undefined
								})()
							: undefined

					// Fetch random tracks from Jellyfin with filters
					const data = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
						ParentId: library.musicLibraryId,
						UserId: user.id,
						IncludeItemTypes: [BaseItemKind.Audio],
						Recursive: true,
						SortBy: [ItemSortBy.Random],
						Filters: apiFilters.length > 0 ? apiFilters : undefined,
						GenreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
						Years: yearsParam,
						Limit: ApiLimits.LibraryShuffle,
						Fields: [
							ItemFields.MediaSources,
							ItemFields.ParentId,
							ItemFields.Path,
							ItemFields.SortName,
							ItemFields.Chapters,
						],
					})

					if (data.Items && data.Items.length > 0) {
						// Map BaseItemDto[] to JellifyTrack[]
						randomTracks = data.Items.map((item) =>
							mapDtoToTrack(item, deviceProfile, QueuingType.FromSelection),
						)
					}
				}

				if (randomTracks && randomTracks.length > 0) {
					let startIndex: number
					let finalQueue: JellifyTrack[]

					if (currentTrack) {
						// Find the current track in the new random list
						const currentTrackIndex = randomTracks.findIndex(
							(track) => track.item.Id === currentTrack.item.Id,
						)

						if (currentTrackIndex >= 0) {
							// Current track is in the random list - use it as the starting point
							startIndex = currentTrackIndex
							finalQueue = randomTracks
						} else {
							// Current track is not in the random list - keep it playing and add random tracks after
							startIndex = 0
							finalQueue = [currentTrack, ...randomTracks]
						}
					} else {
						// No current track - start from the first random track
						startIndex = 0
						finalQueue = randomTracks
					}

					// Save off unshuffledQueue (the new random queue)
					usePlayerQueueStore.getState().setUnshuffledQueue([...finalQueue])

					// Replace the queue with random tracks
					const randomTrackPlaylistId = PlayerQueue.createPlaylist('Library Shuffle')

					PlayerQueue.addTracksToPlaylist(randomTrackPlaylistId, finalQueue, 0)
					PlayerQueue.loadPlaylist(randomTrackPlaylistId)

					if (startIndex > 0) {
						await TrackPlayer.skipToIndex(startIndex)
					}

					if (currentPosition > 0) {
						TrackPlayer.seek(currentPosition)
					}

					// Update state
					usePlayerQueueStore.getState().setQueue(finalQueue)
					usePlayerQueueStore.getState().setCurrentIndex(startIndex)
					usePlayerQueueStore.getState().setCurrentTrack(finalQueue[startIndex])
					usePlayerQueueStore.getState().setShuffled(true)

					return [finalQueue[startIndex], ...finalQueue]
				}
			}
		} catch (error) {
			console.error('Failed to fetch random tracks:', error)
			Toast.show({
				text1: 'Failed to fetch random tracks',
				type: 'error',
			})
			// Fall through to regular shuffle if there's a queue
			if (!playQueue || playQueue.length === 0) {
				return []
			}
		}
	}

	// Regular shuffle logic - requires a queue and current track
	if (!playQueue || playQueue.length <= 1) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return []
	}

	if (isUndefined(currentIndex) || !currentTrack) {
		Toast.show({
			text1: 'No track currently playing',
			type: 'info',
		})
		return []
	}

	// Save off unshuffledQueue
	usePlayerQueueStore.getState().setUnshuffledQueue([...playQueue])

	// Reorder current track to the front
	PlayerQueue.reorderTrackInPlaylist(playlistId!, currentTrack.id, 0)

	const unusedTracks = playQueue
		.filter((_, index) => currentIndex != index)
		.map((track, index) => {
			return { track, index }
		})

	// Remove the rest of the tracks from the playlist
	unusedTracks.forEach(({ track }) => {
		PlayerQueue.removeTrackFromPlaylist(playlistId!, track.id)
	})

	// Get the current track (if any)
	let newShuffledQueue: JellifyTrack[] = []

	// If there are upcoming tracks to shuffle
	if (unusedTracks.length > 0) {
		const { shuffled: shuffledUpcoming } = shuffleJellifyTracks(
			unusedTracks.map(({ track }) => track),
		)

		// Create new queue: played tracks + current + shuffled upcoming
		newShuffledQueue = shuffledUpcoming
	} else {
		// Approach 2: If no upcoming tracks, shuffle entire queue but keep current track position
		// This handles the case where user is at the end of the queue
		if (currentTrack) {
			// Remove current track, shuffle the rest, then put current track back at its position
			const otherTracks = playQueue!.filter((_, index) => index !== currentIndex)
			const { shuffled: shuffledOthers } = shuffleJellifyTracks(otherTracks)

			// Create new queue with current track in the middle
			newShuffledQueue = [
				...shuffledOthers.slice(0, currentIndex),
				currentTrack,
				...shuffledOthers.slice(currentIndex),
			]
		} else {
			// No current track, shuffle everything
			const { shuffled: shuffledAll } = shuffleJellifyTracks(playQueue!)

			newShuffledQueue = shuffledAll
		}
	}

	PlayerQueue.addTracksToPlaylist(playlistId!, newShuffledQueue, 1)

	return [currentTrack, ...newShuffledQueue]
}

export async function handleDeshuffle() {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const shuffled = usePlayerQueueStore.getState().shuffled
	const unshuffledQueue = usePlayerQueueStore.getState().unShuffledQueue
	const currentTrack = usePlayerQueueStore.getState().currentTrack
	const queueRef = usePlayerQueueStore.getState().queueRef

	if (queueRef === 'Library') {
		return await handleShuffle()
	}

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0 || !playlistId) return

	// Move currently playing track to beginning of queue to preserve playback
	PlayerQueue.reorderTrackInPlaylist(playlistId, currentTrack!.id, 0)

	// Find tracks that aren't currently playing, these will be used to repopulate the queue
	const missingQueueItems = unshuffledQueue.filter(
		(track) => track.item.Id !== currentTrack?.item.Id,
	)

	// Find where the currently playing track belonged in the original queue, it will be moved to that position later
	const newCurrentIndex = unshuffledQueue.findIndex(
		(track) => track.item.Id === currentTrack?.item.Id,
	)

	// Clear Upcoming tracks
	missingQueueItems.forEach(({ id }) => PlayerQueue.removeTrackFromPlaylist(playlistId, id))

	// Add the original queue to the end, without the currently playing track since that's still in the queue
	PlayerQueue.addTracksToPlaylist(playlistId, missingQueueItems, 1)

	// Move the currently playing track into position
	PlayerQueue.reorderTrackInPlaylist(playlistId, currentTrack!.id, newCurrentIndex)

	// Just-in-time approach: Don't disrupt current playback
	// The queue will be updated when user skips or when tracks change
	usePlayerQueueStore.getState().setUnshuffledQueue([])
}
