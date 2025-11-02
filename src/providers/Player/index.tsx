import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import { createContext, useCallback, useEffect, useState } from 'react'
import { handleActiveTrackChanged } from './functions'
import JellifyTrack from '../../types/JellifyTrack'
import { useAutoDownload } from '../../stores/settings/usage'
import reportPlaybackStopped from '../../api/mutations/playback/functions/playback-stopped'
import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
import isPlaybackFinished from '../../api/mutations/playback/utils'
import { useJellifyContext } from '..'
import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
import calculateTrackVolume from './utils/normalization'
import saveAudioItem from '../../api/mutations/download/utils'
import { useDownloadingDeviceProfile } from '../../stores/device-profile'
import Initialize from './functions/initialization'
import { useEnableAudioNormalization } from '../../stores/settings/player'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const { api } = useJellifyContext()

	const [initialized, setInitialized] = useState<boolean>(false)

	const [autoDownload] = useAutoDownload()

	const [enableAudioNormalization] = useEnableAudioNormalization()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	usePerformanceMonitor('PlayerProvider', 3)

	const eventHandler = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async (event: any) => {
			switch (event.type) {
				case Event.PlaybackActiveTrackChanged:
					// When we load a new queue, our index is updated before RNTP
					// Because of this, we only need to respond to this event
					// if the index from the event differs from what we have stored
					if (event.track && enableAudioNormalization) {
						console.debug('Normalizing audio track')

						const volume = calculateTrackVolume(event.track)
						await TrackPlayer.setVolume(volume)
					} else if (event.track) {
						await reportPlaybackStarted(api, event.track)
					}

					await handleActiveTrackChanged()

					if (event.lastTrack) {
						if (isPlaybackFinished(event.lastPosition, event.lastTrack.duration ?? 1))
							await reportPlaybackCompleted(api, event.lastTrack as JellifyTrack)
						else await reportPlaybackStopped(api, event.lastTrack as JellifyTrack)
					}
					break

				case Event.PlaybackProgressUpdated:
					console.debug(`Completion percentage: ${event.position / event.duration}`)

					if (event.track) await reportPlaybackProgress(api, event.track, event.position)

					if (event.position / event.duration > 0.3 && autoDownload && event.track)
						await saveAudioItem(api, event.track.item, downloadingDeviceProfile, true)
					break

				case Event.PlaybackState:
					switch (event.state) {
						case State.Playing:
							if (event.track) await reportPlaybackStarted(api, event.track)
							break
						default:
							if (event.track) await reportPlaybackStopped(api, event.track)
							break
					}
					break
			}
		},
		[api, autoDownload, enableAudioNormalization],
	)

	useTrackPlayerEvents(PLAYER_EVENTS, eventHandler)

	useEffect(() => {
		if (!initialized) {
			setInitialized(true)
			Initialize()
		}
	}, [])

	return (
		<PlayerContext.Provider value={{}}>
			<></>
		</PlayerContext.Provider>
	)
}
