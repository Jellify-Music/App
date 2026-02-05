import JellifyTrack from '../../../types/JellifyTrack'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import { isUndefined } from 'lodash'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { getApi, getUser, getLibrary } from '../../../stores'
import { nitroFetch } from '../../../api/utils/nitro'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
} from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { QueuingType } from '../../../enums/queuing-type'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { ApiLimits } from '../../../configs/query.config'
import useLibraryStore from '../../../stores/library'
import { queryClient } from '../../../constants/query-client'
import { AUDIO_CACHE_QUERY } from '../../../api/queries/download/constants'
import { JellifyDownload } from '../../../types/JellifyDownload'
import UserDataQueryKey from '../../../api/queries/user-data/keys'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'

export async function handleShuffle(keepCurrentTrack: boolean = true): Promise<JellifyTrack[]> {
	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentTrack = keepCurrentTrack
		? ((await TrackPlayer.getActiveTrack()) as JellifyTrack)
		: undefined
	const playQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	const queueRef = usePlayerQueueStore.getState().queueRef

	let savedPosition = 0
	if (currentTrack) {
		try {
			const progress = await TrackPlayer.getProgress()
			savedPosition = progress.position
		} catch (error) {
			console.warn('Failed to get current position:', error)
		}
	}

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
					return Promise.resolve([])
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
						return Promise.resolve([])
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
					await TrackPlayer.removeUpcomingTracks()
					await TrackPlayer.setQueue([finalQueue[startIndex]])
					await TrackPlayer.add([
						...finalQueue.slice(0, startIndex),
						...finalQueue.slice(startIndex + 1),
					])

					if (startIndex > 0) {
						await TrackPlayer.move(0, startIndex)
						await TrackPlayer.skip(startIndex)
					}

					if (savedPosition > 0) {
						try {
							await TrackPlayer.seekTo(savedPosition)
						} catch (error) {
							console.warn('Failed to restore playback position:', error)
						}
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
				return Promise.resolve([])
			}
		}
	}

	// Regular shuffle logic - requires a queue and current track
	if (!playQueue || playQueue.length <= 1) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return Promise.resolve([])
	}

	if (isUndefined(currentIndex) || !currentTrack) {
		Toast.show({
			text1: 'No track currently playing',
			type: 'info',
		})
		return Promise.resolve([])
	}

	// Save off unshuffledQueue
	usePlayerQueueStore.getState().setUnshuffledQueue([...playQueue])

	const unusedTracks = playQueue
		.filter((_, index) => currentIndex != index)
		.map((track, index) => {
			return { track, index }
		})

	await TrackPlayer.move(currentIndex, 0)

	await TrackPlayer.removeUpcomingTracks()
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

	await TrackPlayer.add(newShuffledQueue)

	return [currentTrack, ...newShuffledQueue]

	// // Prepare the next few tracks in TrackPlayer for smooth transitions
	// try {
	// 	await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex ?? 0)
	// } catch (error) {
	// 	console.warn('Failed to prepare upcoming tracks after shuffle:', error)
	// }
}

export async function handleDeshuffle() {
	const shuffled = usePlayerQueueStore.getState().shuffled
	const unshuffledQueue = usePlayerQueueStore.getState().unShuffledQueue
	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentTrack = (await TrackPlayer.getActiveTrack()) as JellifyTrack
	const queueRef = usePlayerQueueStore.getState().queueRef
	// const playQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

	if (queueRef === 'Library') {
		return await handleShuffle()
	}

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0) return

	// Move currently playing track to beginning of queue to preserve playback
	await TrackPlayer.move(currentIndex!, 0)

	// Find tracks that aren't currently playing, these will be used to repopulate the queue
	const missingQueueItems = unshuffledQueue.filter(
		(track) => track.item.Id !== currentTrack?.item.Id,
	)

	// Find where the currently playing track belonged in the original queue, it will be moved to that position later
	const newCurrentIndex = unshuffledQueue.findIndex(
		(track) => track.item.Id === currentTrack?.item.Id,
	)

	// Clear Upcoming tracks
	await TrackPlayer.removeUpcomingTracks()

	// Add the original queue to the end, without the currently playing track since that's still in the queue
	await TrackPlayer.add(missingQueueItems)

	// Move the currently playing track into position
	await TrackPlayer.move(0, newCurrentIndex)

	// Just-in-time approach: Don't disrupt current playback
	// The queue will be updated when user skips or when tracks change
	usePlayerQueueStore.getState().setUnshuffledQueue([])
}
