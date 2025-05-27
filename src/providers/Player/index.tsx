import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { JellifyTrack } from '../../types/JellifyTrack'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import TrackPlayer, {
	Event,
	Progress,
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
	CROSSFADE_UPDATE_INTERVAL,
} from '../../player/gapless-config'
import type { CrossfadeState, FadeCurve } from '../../player/helpers/crossfade'
import {
	createInitialCrossfadeState,
	shouldStartCrossfade,
	startCrossfade,
	updateCrossfadeProgress,
	calculateFadeOutVolume,
	calculateFadeInVolume,
} from '../../player/helpers/crossfade'

interface PlayerContext {
	nowPlaying: JellifyTrack | undefined
	playbackState: State | undefined
	useStartPlayback: UseMutationResult<void, Error, void, unknown>
	useTogglePlayback: UseMutationResult<void, Error, void, unknown>
	useSeekTo: UseMutationResult<void, Error, number, unknown>
	useSeekBy: UseMutationResult<void, Error, number, unknown>
}

const PlayerContextInitializer = () => {
	const { api, sessionId } = useJellifyContext()
	const { playQueue, currentIndex, queueRef, skipping } = useQueueContext()

	const nowPlayingJson = storage.getString(MMKVStorageKeys.NowPlaying)

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

	// Crossfade state
	const [crossfadeState, setCrossfadeState] = useState<CrossfadeState>(
		createInitialCrossfadeState(),
	)
	const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null)

	//#endregion State

	//#region Functions
	const handlePlaybackStateChanged = async (state: State) => {
		if (playStateApi && nowPlaying)
			await handlePlaybackState(sessionId, playStateApi, nowPlaying, state)
	}

	/**
	 * A function to handle reporting playback progress to Jellyfin. Does nothing if
	 * the {@link playStateApi} or {@link nowPlaying} are not defined.
	 */
	const handlePlaybackProgressUpdated = async (progress: Progress) => {
		if (playStateApi && nowPlaying)
			await handlePlaybackProgress(sessionId, playStateApi, nowPlaying, progress)
		else if (!playStateApi) console.warn('No play state API found')
		else console.warn('No now playing track found')
	}

	/**
	 * Clean up prefetched track IDs that are no longer relevant
	 * to prevent memory leaks
	 */
	const cleanupPrefetchedIds = (currentIndex: number, playQueue: JellifyTrack[]) => {
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
	}

	/**
	 * Start crossfade transition
	 */
	const startCrossfadeTransition = (duration: number, curve: FadeCurve) => {
		console.debug(`Starting crossfade transition: ${duration}s, curve: ${curve}`)

		const newCrossfadeState = startCrossfade(duration, curve)
		setCrossfadeState(newCrossfadeState)

		// Start crossfade update interval
		if (crossfadeIntervalRef.current) {
			clearInterval(crossfadeIntervalRef.current)
		}

		crossfadeIntervalRef.current = setInterval(() => {
			setCrossfadeState((prevState: CrossfadeState) => {
				const updatedState = updateCrossfadeProgress(prevState, Date.now())

				if (updatedState.isActive) {
					// Calculate and apply volume levels
					const fadeOutVolume = calculateFadeOutVolume(
						updatedState.progress,
						updatedState.curve,
					)
					const fadeInVolume = calculateFadeInVolume(
						updatedState.progress,
						updatedState.curve,
					)

					// Apply crossfade volumes to track player
					TrackPlayer.setVolume(fadeOutVolume).catch(console.warn)

					console.debug(
						`Crossfade progress: ${(updatedState.progress * 100).toFixed(1)}%, fadeOut: ${fadeOutVolume.toFixed(2)}, fadeIn: ${fadeInVolume.toFixed(2)}`,
					)
				} else {
					// Crossfade completed
					console.debug('Crossfade completed')
					TrackPlayer.setVolume(1).catch(console.warn)

					if (crossfadeIntervalRef.current) {
						clearInterval(crossfadeIntervalRef.current)
						crossfadeIntervalRef.current = null
					}
				}

				return updatedState
			})
		}, CROSSFADE_UPDATE_INTERVAL)
	}

	/**
	 * Stop active crossfade transition
	 */
	const stopCrossfadeTransition = () => {
		if (crossfadeIntervalRef.current) {
			clearInterval(crossfadeIntervalRef.current)
			crossfadeIntervalRef.current = null
		}
		setCrossfadeState(createInitialCrossfadeState())
		TrackPlayer.setVolume(1).catch(console.warn)
	}

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
			if ((await TrackPlayer.getPlaybackState()).state === State.Playing)
				return TrackPlayer.pause()
			else return TrackPlayer.play()
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
	const { autoDownload, crossfadeEnabled, crossfadeDuration, crossfadeCurve, autoCrossfade } =
		useSettingsContext()
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

					// --- CROSSFADE LOGIC ---
					if (crossfadeEnabled && autoCrossfade && !crossfadeState.isActive) {
						const hasNextTrack = currentIndex < playQueue.length - 1

						if (
							hasNextTrack &&
							shouldStartCrossfade(position, duration, crossfadeDuration)
						) {
							console.debug(`Starting crossfade: ${timeRemaining}s remaining`)
							startCrossfadeTransition(crossfadeDuration, crossfadeCurve)
						}
					}

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
	 * Set the now playing track to the track at the current index in the play queue
	 */
	useEffect(() => {
		if (currentIndex > -1 && playQueue.length > currentIndex && !skipping) {
			console.debug(`Setting now playing to queue index ${currentIndex}`)
			setNowPlaying(playQueue[currentIndex])
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
	 * Handle crossfade cleanup on track changes and component unmount
	 */
	useEffect(() => {
		// Stop any active crossfade when track changes
		if (crossfadeState.isActive) {
			stopCrossfadeTransition()
		}
	}, [currentIndex])

	/**
	 * Cleanup crossfade interval on unmount
	 */
	useEffect(() => {
		return () => {
			if (crossfadeIntervalRef.current) {
				clearInterval(crossfadeIntervalRef.current)
			}
		}
	}, [])

	//#endregion useEffects

	//#region return
	return {
		nowPlaying,
		useStartPlayback,
		useTogglePlayback,
		useSeekTo,
		useSeekBy,
		playbackState,
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

	return <PlayerContext.Provider value={context}>{children}</PlayerContext.Provider>
}

/**
 * Hook to use the player context. This is used to get the player context from the
 * {@link PlayerProvider}.
 * @returns The {@link PlayerContext}
 */
export const usePlayerContext = () => useContext(PlayerContext)
