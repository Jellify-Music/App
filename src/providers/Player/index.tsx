import { createContext } from 'use-context-selector'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { Event, useTrackPlayerEvents } from 'react-native-track-player'
import { refetchNowPlaying } from './functions/queries'
import { useEffect, useRef } from 'react'
import { useAudioNormalization, useInitialization } from './hooks/mutations'
import { useCurrentIndex, useNowPlaying, useQueue } from './hooks/queries'
import {
	cacheTrackIfConfigured,
	handlePlaybackProgress,
	handlePlaybackState,
} from './utils/handlers'
import { useJellifyContext } from '..'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { handleActiveTrackChanged } from './functions'
import { useAutoDownloadContext } from '../Settings'
import { useNetworkContext } from '../Network'
import JellifyTrack from '@/src/types/JellifyTrack'
import { useIsRestoring } from '@tanstack/react-query'
import useDeviceProfile from '../../stores/device-profile'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const { api } = useJellifyContext()

	const playStateApi = api ? getPlaystateApi(api) : undefined

	const autoDownload = useAutoDownloadContext()
	const deviceProfile = useDeviceProfile()

	const { downloadedTracks, networkStatus } = useNetworkContext()

	usePerformanceMonitor('PlayerProvider', 3)

	const { mutate: initializePlayQueue } = useInitialization()

	const { data: currentIndex } = useCurrentIndex()

	const { data: playQueue } = useQueue()

	const { data: nowPlaying } = useNowPlaying()

	const { mutate: normalizeAudioVolume } = useAudioNormalization()

	const isRestoring = useIsRestoring()

	const prefetchedTrackIds = useRef<Set<string>>(new Set())

	useTrackPlayerEvents(PLAYER_EVENTS, (event) => {
		switch (event.type) {
			case Event.PlaybackActiveTrackChanged:
				if (event.track) normalizeAudioVolume(event.track as JellifyTrack)
				handleActiveTrackChanged()
				refetchNowPlaying()
				break
			case Event.PlaybackProgressUpdated:
				handlePlaybackProgress(playStateApi, deviceProfile, event.duration, event.position)
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
				handlePlaybackState(playStateApi, deviceProfile, event.state)
				break
		}
	})

	useEffect(() => {
		if (!isRestoring) initializePlayQueue()
	}, [isRestoring])

	return (
		<PlayerContext.Provider value={{}}>
			<></>
		</PlayerContext.Provider>
	)
}
