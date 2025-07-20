import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
	useMemo,
	useCallback,
} from 'react'
import JellifyTrack from '../../types/JellifyTrack'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import TrackPlayer, {
	Event,
	Progress,
	RepeatMode,
	State,
	usePlaybackState,
	useTrackPlayerEvents,
} from 'react-native-track-player'
import { handlePlaybackProgress, handlePlaybackState } from '../../player/handlers'
import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { trigger } from 'react-native-haptic-feedback'

import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { useNetworkContext } from '../Network'
import { useQueueContext } from './queue'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { useJellifyContext } from '..'
import { isUndefined } from 'lodash'
import { useSettingsContext } from '../Settings'
import {
	getTracksToPreload,
	shouldStartPrefetching,
	optimizePlayerQueue,
} from '../../player/helpers/gapless'
import {
	PREFETCH_THRESHOLD_SECONDS,
	QUEUE_PREPARATION_THRESHOLD_SECONDS,
} from '../../player/gapless-config'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'

interface PlayerContext {
	nowPlaying: JellifyTrack | undefined
	playbackState: State | undefined
	repeatMode: RepeatMode
	shuffled: boolean
	useToggleRepeatMode: UseMutationResult<void, Error, void, unknown>
	useToggleShuffle: UseMutationResult<void, Error, void, unknown>
	useStartPlayback: UseMutationResult<void, Error, void, unknown>
	useTogglePlayback: UseMutationResult<void, Error, void, unknown>
	useSeekTo: UseMutationResult<void, Error, number, unknown>
	useSeekBy: UseMutationResult<void, Error, number, unknown>
}

const PlayerContextInitializer = () => {
	const { api, sessionId } = useJellifyContext()
	const {
		playQueue,
		currentIndex,
		queueRef,
		skipping,
		setShuffled,
		setCurrentIndex,
		unshuffledQueue,
		setUnshuffledQueue,
		shuffled,
		setPlayQueue,
	} = useQueueContext()

	const nowPlayingJson = storage.getString(MMKVStorageKeys.NowPlaying)
	const repeatModeJson = storage.getString(MMKVStorageKeys.RepeatMode)

	/**
	 * A Jellyfin {@link PlaystateApi} instance. Used to report playback state and progress
	 * to Jellyfin.
	 */
	let playStateApi: PlaystateApi | undefined

	/**
	 * Initialize the {@link playStateApi} instance.
	 */
	if (!isUndefined(api)) playStateApi = getPlaystateApi(api)

	//#region State
	const [nowPlaying, setNowPlaying] = useState<JellifyTrack | undefined>(
		nowPlayingJson ? JSON.parse(nowPlayingJson) : undefined,
	)

	const [initialized, setInitialized] = useState<boolean>(false)
	const [repeatMode, setRepeatMode] = useState<RepeatMode>(
		repeatModeJson ? JSON.parse(repeatModeJson) : RepeatMode.Off,
	)

	//#endregion State

	//#region Functions
	const toggleRepeatMode = async () => {
		trigger('impactMedium')
		await TrackPlayer.setRepeatMode(
			repeatMode === RepeatMode.Off
				? RepeatMode.Queue
				: repeatMode === RepeatMode.Queue
					? RepeatMode.Track
					: RepeatMode.Off,
		)
		setRepeatMode(
			repeatMode === RepeatMode.Off
				? RepeatMode.Queue
				: repeatMode === RepeatMode.Queue
					? RepeatMode.Track
					: RepeatMode.Off,
		)
	}

	const handleShuffle = useCallback(async () => {
		try {
			trigger('impactMedium')
		} catch (error) {
			console.warn('Haptic feedback failed:', error)
		}

		// Don't shuffle if queue is empty or has only one track
		if (playQueue.length <= 1) {
			Toast.show({
				text1: 'Nothing to shuffle',
				type: 'info',
			})
			return
		}

		try {
			// Store the original queue for deshuffle
			setUnshuffledQueue(playQueue)

			// Get the current track (if any)
			const currentTrack = currentIndex >= 0 ? playQueue[currentIndex] : null
			let newShuffledQueue: JellifyTrack[] = []

			// Approach 1: Only shuffle upcoming tracks (preserves listening history)
			const upcomingTracks = playQueue.slice(currentIndex + 1)

			// If there are upcoming tracks to shuffle
			if (upcomingTracks.length > 0) {
				const { shuffled: shuffledUpcoming } = shuffleJellifyTracks(upcomingTracks)

				// Create new queue: played tracks + current + shuffled upcoming
				newShuffledQueue = [
					...playQueue.slice(0, currentIndex + 1), // Keep played + current
					...shuffledUpcoming, // Shuffle only upcoming
				]

				console.debug(
					`Shuffled ${shuffledUpcoming.length} upcoming tracks. Current track and history preserved.`,
				)

				Toast.show({
					text1: 'Shuffled',
					text2: `${shuffledUpcoming.length} upcoming tracks`,
					type: 'success',
				})
			} else {
				// Approach 2: If no upcoming tracks, shuffle entire queue but keep current track position
				// This handles the case where user is at the end of the queue
				if (currentTrack) {
					// Remove current track, shuffle the rest, then put current track back at its position
					const otherTracks = playQueue.filter((_, index) => index !== currentIndex)
					const { shuffled: shuffledOthers } = shuffleJellifyTracks(otherTracks)

					// Create new queue with current track in the middle
					newShuffledQueue = [
						...shuffledOthers.slice(0, currentIndex),
						currentTrack,
						...shuffledOthers.slice(currentIndex),
					]

					console.debug(
						`Shuffled entire queue with current track preserved at index ${currentIndex}.`,
					)

					Toast.show({
						text1: 'Shuffled',
						text2: 'Entire queue shuffled',
						type: 'success',
					})
				} else {
					// No current track, shuffle everything
					const { shuffled: shuffledAll } = shuffleJellifyTracks(playQueue)

					newShuffledQueue = shuffledAll

					console.debug(`Shuffled entire queue.`)

					Toast.show({
						text1: 'Shuffled',
						text2: 'Entire queue',
						type: 'success',
					})
				}
			}

			// Update app state
			setShuffled(true)
			setPlayQueue(newShuffledQueue)

			// Prepare the next few tracks in TrackPlayer for smooth transitions
			try {
				const { ensureUpcomingTracksInQueue } = await import('../../player/helpers/gapless')
				await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex)
			} catch (error) {
				console.warn('Failed to prepare upcoming tracks after shuffle:', error)
			}
		} catch (error) {
			console.error('Failed to shuffle queue:', error)
			Toast.show({
				text1: 'Failed to shuffle',
				type: 'error',
			})
		}
	}, [
		playQueue,
		currentIndex,
		setUnshuffledQueue,
		setShuffled,
		setPlayQueue,
		setCurrentIndex,
		shuffled,
		nowPlaying,
	])

	const handleDeshuffle = useCallback(async () => {
		try {
			trigger('impactMedium')
		} catch (error) {
			console.warn('Haptic feedback failed:', error)
		}

		// Don't deshuffle if not shuffled or no unshuffled queue stored
		if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0) {
			Toast.show({
				text1: 'Nothing to deshuffle',
				type: 'info',
			})
			return
		}

		try {
			// Simply restore the original queue and clear shuffle state
			setPlayQueue(unshuffledQueue)
			setShuffled(false)

			// Find the current track's position in the original queue
			const originalIndex = unshuffledQueue.findIndex(
				(track) => track.item.Id === nowPlaying?.item.Id,
			)

			const newCurrentIndex = originalIndex !== -1 ? originalIndex : currentIndex

			if (originalIndex !== -1) {
				setCurrentIndex(originalIndex)
			}

			// Just-in-time approach: Don't disrupt current playback
			// The queue will be updated when user skips or when tracks change
			console.debug(
				`Restored original app queue, ${unshuffledQueue.length} tracks. TrackPlayer queue will be updated as needed.`,
			)

			// Optionally, prepare the next few tracks in TrackPlayer for smooth transitions
			try {
				const { ensureUpcomingTracksInQueue } = await import('../../player/helpers/gapless')
				await ensureUpcomingTracksInQueue(unshuffledQueue, newCurrentIndex)
			} catch (error) {
				console.warn('Failed to prepare upcoming tracks after deshuffle:', error)
			}

			Toast.show({
				text1: 'Deshuffled',
				type: 'success',
			})
		} catch (error) {
			console.error('Failed to deshuffle queue:', error)
			Toast.show({
				text1: 'Failed to deshuffle',
				type: 'error',
			})
		}
	}, [
		unshuffledQueue,
		shuffled,
		setPlayQueue,
		setShuffled,
		setCurrentIndex,
		currentIndex,
		nowPlaying,
	])

	const handlePlaybackStateChanged = useCallback(
		async (state: State) => {
			if (playStateApi && nowPlaying)
				await handlePlaybackState(sessionId, playStateApi, nowPlaying, state)
		},
		[playStateApi, nowPlaying, sessionId],
	)

	/**
	 * A function to handle reporting playback progress to Jellyfin. Does nothing if
	 * the {@link playStateApi} or {@link nowPlaying} are not defined.
	 */
	const handlePlaybackProgressUpdated = useCallback(
		async (progress: Progress) => {
			if (playStateApi && nowPlaying)
				await handlePlaybackProgress(sessionId, playStateApi, nowPlaying, progress)
			else if (!playStateApi) console.warn('No play state API found')
			else console.warn('No now playing track found')
		},
		[playStateApi, nowPlaying, sessionId],
	)

	/**
	 * Clean up prefetched track IDs that are no longer relevant
	 * to prevent memory leaks
	 */
	const cleanupPrefetchedIds = useCallback((currentIndex: number, playQueue: JellifyTrack[]) => {
		const idsToKeep = new Set<string>()

		// Keep IDs for current track and next 5 tracks
		for (
			let i = Math.max(0, currentIndex - 1);
			i < Math.min(playQueue.length, currentIndex + 6);
			i++
		) {
			const track = playQueue[i]
			if (track?.item?.Id) {
				idsToKeep.add(track.item.Id)
			}
		}

		// Remove old IDs that are no longer relevant
		const oldSize = prefetchedTrackIds.current.size
		prefetchedTrackIds.current = new Set(
			[...prefetchedTrackIds.current].filter((id) => idsToKeep.has(id)),
		)

		if (oldSize !== prefetchedTrackIds.current.size) {
			console.debug(
				`Cleaned up ${oldSize - prefetchedTrackIds.current.size} old prefetched track IDs`,
			)
		}
	}, [])

	//#endregion Functions

	//#region Hooks
	/**
	 * A mutation to handle starting playback
	 */
	const useStartPlayback = useMutation({
		mutationFn: TrackPlayer.play,
	})

	/**
	 * A mutation to handle toggling the playback state
	 */
	const useTogglePlayback = useMutation({
		mutationFn: async () => {
			trigger('impactMedium')

			const { state } = await TrackPlayer.getPlaybackState()

			if (state === State.Playing) {
				return TrackPlayer.pause()
			}

			const { duration, position } = await TrackPlayer.getProgress()

			// if the track has ended, seek to start and play
			if (duration <= position) {
				await TrackPlayer.seekTo(0)
			}
			return TrackPlayer.play()
		},
	})

	const useToggleRepeatMode = useMutation({
		mutationFn: async () => {
			await toggleRepeatMode()
		},
	})

	const useToggleShuffle = useMutation({
		mutationFn: async () => {
			try {
				if (shuffled) {
					await handleDeshuffle()
				} else {
					await handleShuffle()
				}
			} catch (error) {
				console.error('Failed to toggle shuffle:', error)
				Toast.show({
					text1: 'Failed to toggle shuffle',
					type: 'error',
				})
			}
		},
	})

	/**
	 * A mutation to handle seeking to a specific position in the track
	 */
	const useSeekTo = useMutation({
		mutationFn: async (position: number) => {
			trigger('impactLight')
			await TrackPlayer.seekTo(position)
		},
	})

	/**
	 * A mutation to handle seeking to a specific position in the track
	 */
	const useSeekBy = useMutation({
		mutationFn: async (seekSeconds: number) => {
			trigger('clockTick')

			await TrackPlayer.seekBy(seekSeconds)
		},
	})

	/**
	 * A mutation to handle reporting playback state to Jellyfin
	 */
	const usePlaybackStateChanged = useMutation({
		mutationFn: async (state: State) => handlePlaybackStateChanged(state),
	})

	/**
	 * A mutation to handle reporting playback progress to Jellyfin
	 */
	const usePlaybackProgressUpdated = useMutation({
		mutationFn: async (progress: Progress) => handlePlaybackProgressUpdated(progress),
	})
	//#endregion

	//#region RNTP Setup

	const { state: playbackState } = usePlaybackState()
	const { useDownload, useDownloadMultiple, downloadedTracks, networkStatus } =
		useNetworkContext()
	const { autoDownload } = useSettingsContext()
	const prefetchedTrackIds = useRef<Set<string>>(new Set())

	/**
	 * Use the {@link useTrackPlayerEvents} hook to listen for events from the player.
	 *
	 * This is use to report playback status to Jellyfin, and as such the player context
	 * is only concerned about the playback state and progress.
	 */
	useTrackPlayerEvents([Event.PlaybackProgressUpdated, Event.PlaybackState], (event) => {
		switch (event.type) {
			case Event.PlaybackState: {
				usePlaybackStateChanged.mutate(event.state)
				break
			}
			case Event.PlaybackProgressUpdated: {
				console.debug('Playback progress updated')
				usePlaybackProgressUpdated.mutate(event)

				// Cache playing track at 20 seconds if it's not already downloaded
				if (
					Math.floor(event.position) === 20 &&
					downloadedTracks?.filter((download) => download.item.Id === nowPlaying!.item.Id)
						.length === 0 &&
					// Only download if we are online or *optimistically* if the network status is unknown
					[networkStatusTypes.ONLINE, undefined, null].includes(
						networkStatus as networkStatusTypes,
					) &&
					// Only download if auto-download is enabled
					autoDownload
				)
					useDownload.mutate(nowPlaying!.item)

				// --- ENHANCED GAPLESS PLAYBACK LOGIC ---
				if (nowPlaying && playQueue && typeof currentIndex === 'number') {
					const position = Math.floor(event.position)
					const duration = Math.floor(event.duration)
					const timeRemaining = duration - position

					// Check if we should start prefetching tracks
					if (shouldStartPrefetching(position, duration, PREFETCH_THRESHOLD_SECONDS)) {
						const tracksToPreload = getTracksToPreload(
							playQueue,
							currentIndex,
							prefetchedTrackIds.current,
						)

						if (tracksToPreload.length > 0) {
							console.debug(
								`Gapless: Found ${tracksToPreload.length} tracks to preload (${timeRemaining}s remaining)`,
							)

							// Filter tracks that aren't already downloaded
							const tracksToDownload = tracksToPreload.filter(
								(track) =>
									downloadedTracks?.filter(
										(download) => download.item.Id === track.item.Id,
									).length === 0,
							)

							if (
								tracksToDownload.length > 0 &&
								[networkStatusTypes.ONLINE, undefined, null].includes(
									networkStatus as networkStatusTypes,
								)
							) {
								console.debug(
									`Gapless: Starting download of ${tracksToDownload.length} tracks`,
								)
								useDownloadMultiple.mutate(tracksToDownload)
								// Mark tracks as prefetched
								tracksToDownload.forEach((track) => {
									if (track.item.Id) {
										prefetchedTrackIds.current.add(track.item.Id)
									}
								})
							}
						}
					}

					// Optimize the TrackPlayer queue for smooth transitions
					if (timeRemaining <= QUEUE_PREPARATION_THRESHOLD_SECONDS) {
						console.debug(
							`Gapless: Optimizing player queue (${timeRemaining}s remaining)`,
						)
						optimizePlayerQueue(playQueue, currentIndex).catch((error) =>
							console.warn('Failed to optimize player queue:', error),
						)
					}
				}

				break
			}
		}
	})

	//#endregion RNTP Setup

	//#region useEffects
	/**
	 * Store the now playing track in storage when it changes
	 */
	useEffect(() => {
		if (nowPlaying) storage.set(MMKVStorageKeys.NowPlaying, JSON.stringify(nowPlaying))
	}, [nowPlaying])

	/**
	 * Store the repeat mode in storage when it changes
	 */
	useEffect(() => {
		storage.set(MMKVStorageKeys.RepeatMode, JSON.stringify(repeatMode))
	}, [repeatMode])

	/**
	 * Set the now playing track to the track at the current index in the play queue
	 */
	useEffect(() => {
		if (currentIndex > -1 && playQueue.length > currentIndex && !skipping) {
			console.debug(`Setting now playing to queue index ${currentIndex}`)
			setNowPlaying(playQueue[currentIndex])
		}

		if (currentIndex === -1) {
			setNowPlaying(undefined)
		}
	}, [currentIndex, playQueue, skipping])

	/**
	 * Initialize the player. This is used to load the queue from the {@link QueueProvider}
	 * and set it to the player if we have already completed the onboarding process
	 * and the user has a valid queue in storage
	 */
	useEffect(() => {
		console.debug('Initialized', initialized)
		console.debug('Play queue length', playQueue.length)
		console.debug('Current index', currentIndex)
		if (playQueue.length > 0 && currentIndex > -1 && !initialized) {
			TrackPlayer.setQueue(playQueue)
			TrackPlayer.skip(currentIndex)
			console.debug('Loaded queue from storage')
			setInitialized(true)
		} else if (queueRef === 'Recently Played' && currentIndex === -1) {
			console.debug('Not loading queue as it is empty')
			setInitialized(true)
		}
	}, [])

	/**
	 * Clean up prefetched track IDs when the current index changes significantly
	 */
	useEffect(() => {
		if (playQueue.length > 0 && typeof currentIndex === 'number' && currentIndex > -1) {
			cleanupPrefetchedIds(currentIndex, playQueue)
		}
	}, [currentIndex, playQueue])

	/**
	 * Store the shuffle state in storage when it changes
	 */
	useEffect(() => {
		storage.set(MMKVStorageKeys.Shuffled, shuffled)
	}, [shuffled])

	//#endregion useEffects

	//#region return
	return {
		nowPlaying,
		repeatMode,
		shuffled,
		useToggleRepeatMode,
		useStartPlayback,
		useTogglePlayback,
		useSeekTo,
		useSeekBy,
		playbackState,
		useToggleShuffle,
	}
	//#endregion return
}

//#region Create PlayerContext
/**
 * Context for the player. This is used to provide the player context to the
 * player components.
 * @param param0 The default {@link PlayerContext}
 * @returns The default {@link PlayerContext}
 */
export const PlayerContext = createContext<PlayerContext>({
	nowPlaying: undefined,
	repeatMode: RepeatMode.Off,
	shuffled: false,
	useToggleRepeatMode: {
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
	playbackState: undefined,
	useStartPlayback: {
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
	useTogglePlayback: {
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
	useToggleShuffle: {
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
	useSeekTo: {
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
	useSeekBy: {
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
//#endregion Create PlayerContext

/**
 * Provider for the player context. This is used to provide player controls and the currently
 * playing track to child components.
 * @param param0 The {@link ReactNode} to render
 * @returns A {@link ReactNode}
 */
export const PlayerProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	const context = PlayerContextInitializer()

	// Memoize the context value to prevent unnecessary re-renders
	// Only recreate when essential values change
	const value = useMemo(
		() => context,
		[
			context.nowPlaying?.item?.Id,
			context.playbackState,
			context.repeatMode,
			context.shuffled,
			// Don't include mutation objects as dependencies since they're stable
		],
	)

	return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

/**
 * Hook to use the player context. This is used to get the player context from the
 * {@link PlayerProvider}.
 * @returns The {@link PlayerContext}
 */
export const usePlayerContext = () => useContext(PlayerContext)
