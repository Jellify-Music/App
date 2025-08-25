import { createContext } from 'use-context-selector'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { Event, useTrackPlayerEvents } from 'react-native-track-player'
import { invalidateNowPlaying } from './functions/queries'
import { useEffect, useState } from 'react'
import { useInitialization } from './hooks/mutations'
import { useCurrentIndex } from './hooks/queries'
import { handlePlaybackProgress, handlePlaybackState } from './utils/handlers'
import { useJellifyContext } from '..'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { getCurrentTrack, handleActiveTrackChanged } from './functions'
import { useStreamingQualityContext } from '../Settings'

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

	const streamingQuality = useStreamingQualityContext()

	const { data: currentIndex } = useCurrentIndex()

	const [initialized, setInitialized] = useState<boolean>(false)

	usePerformanceMonitor('PlayerProvider', 3)

	const { mutate: initializePlayQueue } = useInitialization()

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
