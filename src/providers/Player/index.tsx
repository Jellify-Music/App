import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import { createContext, useCallback, useEffect } from 'react'
import { handleActiveTrackChanged } from './functions'
import JellifyTrack from '../../types/JellifyTrack'
import { useIsRestoring } from '@tanstack/react-query'
import { useAutoDownload } from '../../stores/settings/usage'
import { queryClient } from '../../constants/query-client'
import { NOW_PLAYING_QUERY_KEY } from './constants/query-keys'
import reportPlaybackStopped from '../../api/mutations/playback/functions/playback-stopped'
import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
import isPlaybackFinished from '../../api/mutations/playback/utils'
import { useJellifyContext } from '..'
import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
import calculateTrackVolume from './utils/normalization'
import saveAudioItem from '../../api/mutations/download/utils'
import { useDownloadingDeviceProfile } from '../../stores/device-profile'
import { NOW_PLAYING_QUERY } from './constants/queries'
import Initialize from './functions/initialization'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const { api } = useJellifyContext()

	const [autoDownload] = useAutoDownload()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	usePerformanceMonitor('PlayerProvider', 3)

	const isRestoring = useIsRestoring()

	const eventHandler = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async (event: any) => {
			let nowPlaying: JellifyTrack | undefined

			switch (event.type) {
				case Event.PlaybackActiveTrackChanged:
					if (event.track) {
						nowPlaying = event.track as JellifyTrack

						const volume = calculateTrackVolume(nowPlaying)
						await TrackPlayer.setVolume(volume)
					}

					await handleActiveTrackChanged()

					if (event.lastTrack)
						if (isPlaybackFinished(event.lastPosition, event.lastTrack.duration ?? 1))
							reportPlaybackCompleted(api, event.lastTrack as JellifyTrack)
						else reportPlaybackStopped(api, event.lastTrack as JellifyTrack)

					reportPlaybackStarted(api, event.track)
					break

				case Event.PlaybackProgressUpdated:
					console.debug(`Completion percentage: ${event.position / event.duration}`)

					nowPlaying = queryClient.getQueryData<JellifyTrack>(NOW_PLAYING_QUERY_KEY)

					if (nowPlaying) {
						reportPlaybackProgress(api, nowPlaying, event.position)
					}

					if (event.position / event.duration > 0.3 && autoDownload && nowPlaying)
						saveAudioItem(api, nowPlaying.item, downloadingDeviceProfile, true)
					break

				case Event.PlaybackState:
					nowPlaying = queryClient.getQueryData<JellifyTrack>(NOW_PLAYING_QUERY_KEY)

					switch (event.state) {
						case State.Playing:
							if (nowPlaying) reportPlaybackStarted(api, nowPlaying)
							queryClient.ensureQueryData(NOW_PLAYING_QUERY)
							break
						case State.Paused:
						case State.Stopped:
						case State.Ended:
							if (nowPlaying) reportPlaybackStopped(api, nowPlaying)
					}
					break
			}
		},
		[api, autoDownload],
	)

	useTrackPlayerEvents(PLAYER_EVENTS, eventHandler)

	useEffect(() => {
		if (!isRestoring) Initialize()
	}, [isRestoring])

	return (
		<PlayerContext.Provider value={{}}>
			<></>
		</PlayerContext.Provider>
	)
}
