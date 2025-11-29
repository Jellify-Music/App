import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import { createContext, useCallback, useEffect, useState } from 'react'
import { handleActiveTrackChanged } from './functions'
import JellifyTrack from '../../types/JellifyTrack'
import { useAutoDownload } from '../../stores/settings/usage'
import reportPlaybackStopped from '../../api/mutations/playback/functions/playback-stopped'
import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
import isPlaybackFinished from '../../api/mutations/playback/utils'
import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
import calculateTrackVolume from './utils/normalization'
import saveAudioItem from '../../api/mutations/download/utils'
import { useDownloadingDeviceProfile } from '../../stores/device-profile'
import Initialize from './functions/initialization'
import { useEnableAudioNormalization } from '../../stores/settings/player'
import { useApi } from '../../stores'
import { usePlayerQueueStore } from '../../stores/player/queue'
import usePostFullCapabilities from '../../api/mutations/session'

const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const api = useApi()

	const [initialized, setInitialized] = useState<boolean>(false)

	const [autoDownload] = useAutoDownload()

	const [enableAudioNormalization] = useEnableAudioNormalization()

	usePostFullCapabilities()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	usePerformanceMonitor('PlayerProvider', 3)

	const eventHandler = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async (event: any) => {
			switch (event.type) {
				case Event.PlaybackActiveTrackChanged: {
					// When we load a new queue, our index is updated before RNTP
					// Because of this, we only need to respond to this event
					// if the index from the event differs from what we have stored
					if (event.track && enableAudioNormalization) {
						const volume = calculateTrackVolume(event.track)
						await TrackPlayer.setVolume(volume)
					} else if (event.track) {
						try {
							await reportPlaybackStarted(api, event.track)
						} catch (error) {
							console.error('Unable to report playback started for track', error)
						}
					}

					await handleActiveTrackChanged()

					if (event.lastTrack) {
						try {
							if (
								isPlaybackFinished(
									event.lastPosition,
									event.lastTrack.duration ?? 1,
								)
							)
								await reportPlaybackCompleted(api, event.lastTrack as JellifyTrack)
							else await reportPlaybackStopped(api, event.lastTrack as JellifyTrack)
						} catch (error) {
							console.error('Unable to report playback stopped for lastTrack', error)
						}
					}
					break
				}
				case Event.PlaybackProgressUpdated: {
					const currentTrack = usePlayerQueueStore.getState().currentTrack

					if (event.position / event.duration > 0.3 && autoDownload && currentTrack) {
						await saveAudioItem(api, currentTrack.item, downloadingDeviceProfile, true)
					}

					break
				}

				case Event.PlaybackState: {
					const currentTrack = usePlayerQueueStore.getState().currentTrack
					switch (event.state) {
						case State.Playing:
							if (currentTrack) await reportPlaybackStarted(api, currentTrack)
							break
						default:
							if (currentTrack) await reportPlaybackStopped(api, currentTrack)
							break
					}
					break
				}
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
