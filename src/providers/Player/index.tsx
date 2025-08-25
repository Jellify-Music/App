import { createContext } from 'use-context-selector'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { Event, useTrackPlayerEvents } from 'react-native-track-player'
import { invalidateNowPlaying } from './functions/queries'
import { useEffect, useRef, useState } from 'react'
import { useInitialization } from './hooks/mutations'
import { useCurrentIndex, useNowPlaying, useQueue } from './hooks/queries'
import {
	cacheTrackIfConfigured,
	handlePlaybackProgress,
	handlePlaybackState,
} from './utils/handlers'
import { useJellifyContext } from '..'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { getCurrentTrack, handleActiveTrackChanged } from './functions'
import { useAutoDownloadContext, useStreamingQualityContext } from '../Settings'
import { useNetworkContext } from '../Network'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const { api } = useJellifyContext()

	const playStateApi = getPlaystateApi(api!)

	const autoDownload = useAutoDownloadContext()
	const streamingQuality = useStreamingQualityContext()

	const { downloadedTracks, networkStatus } = useNetworkContext()

	usePerformanceMonitor('PlayerProvider', 3)

	const { mutate: initializePlayQueue } = useInitialization()

	const { data: currentIndex } = useCurrentIndex()

	const { data: playQueue } = useQueue()

	const { data: nowPlaying } = useNowPlaying()

	const prefetchedTrackIds = useRef<Set<string>>(new Set())

	useTrackPlayerEvents(PLAYER_EVENTS, (event) => {
		switch (event.type) {
			case Event.PlaybackActiveTrackChanged:
				handleActiveTrackChanged()
				invalidateNowPlaying()
				break
			case Event.PlaybackProgressUpdated:
				handlePlaybackProgress(
					playStateApi,
					streamingQuality,
					event.duration,
					event.position,
				)
				cacheTrackIfConfigured(
					autoDownload,
					currentIndex,
					nowPlaying,
					playQueue,
					downloadedTracks,
					prefetchedTrackIds.current,
					networkStatus,
					event.position,
					event.duration,
				)
				break
			case Event.PlaybackState:
				handlePlaybackState(playStateApi, streamingQuality, event.state)
				break
		}
	})

	useEffect(() => {
		initializePlayQueue()
	}, [])

	return (
		<PlayerContext.Provider value={{}}>
			<></>
		</PlayerContext.Provider>
	)
}
