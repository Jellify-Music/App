import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import { refetchNowPlaying } from './functions/queries'
import { createContext, useEffect } from 'react'
import { useAudioNormalization, useInitialization } from './hooks/mutations'
import { useCurrentIndex, useNowPlaying, useQueue } from './hooks/queries'
import { handleActiveTrackChanged } from './functions'
import JellifyTrack from '../../types/JellifyTrack'
import { useIsRestoring } from '@tanstack/react-query'
import {
	useReportPlaybackProgress,
	useReportPlaybackStarted,
	useReportPlaybackStopped,
} from '../../api/mutations/playback'
import { useDownloadAudioItem } from '../../api/mutations/download'
import { useAutoDownload } from '../../stores/settings/usage'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const [autoDownload] = useAutoDownload()

	usePerformanceMonitor('PlayerProvider', 3)

	const { mutate: initializePlayQueue } = useInitialization()

	const { data: currentIndex } = useCurrentIndex()

	const { data: playQueue } = useQueue()

	const { data: nowPlaying } = useNowPlaying()

	const { mutate: normalizeAudioVolume } = useAudioNormalization()

	const { mutate: reportPlaybackStarted } = useReportPlaybackStarted()
	const { mutate: reportPlaybackProgress } = useReportPlaybackProgress()
	const { mutate: reportPlaybackStopped } = useReportPlaybackStopped()

	const [downloadProgress, downloadAudioItem] = useDownloadAudioItem()

	const isRestoring = useIsRestoring()

	useTrackPlayerEvents(PLAYER_EVENTS, (event) => {
		switch (event.type) {
			case Event.PlaybackActiveTrackChanged:
				if (event.track) normalizeAudioVolume(event.track as JellifyTrack)

				handleActiveTrackChanged()
				refetchNowPlaying()

				if (event.lastTrack)
					reportPlaybackStopped({
						track: event.lastTrack as JellifyTrack,
						lastPosition: event.lastPosition,
						duration: (event.lastTrack as JellifyTrack).duration,
					})
				break
			case Event.PlaybackProgressUpdated:
				console.debug(`Completion percentage: ${event.position / event.duration}`)
				if (nowPlaying)
					reportPlaybackProgress({
						track: nowPlaying,
						position: event.position,
					})

				if (event.position / event.duration > 0.3 && autoDownload && nowPlaying)
					downloadAudioItem({ item: nowPlaying.item, autoCached: true })
				break
			case Event.PlaybackState:
				switch (event.state) {
					case State.Playing:
						if (nowPlaying)
							reportPlaybackStarted({
								track: nowPlaying,
							})
						break
					case State.Paused:
					case State.Stopped:
					case State.Ended:
						if (nowPlaying)
							reportPlaybackStopped({
								track: nowPlaying,
								lastPosition: 0,
								duration: nowPlaying.duration,
							})
				}
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
