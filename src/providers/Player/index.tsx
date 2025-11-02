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
import { usePlayerQueueStore } from '../../stores/player/queue'

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
				case Event.PlaybackActiveTrackChanged: {
					// When we load a new queue, our index is updated before RNTP
					// Because of this, we only need to respond to this event
					// if the index from the event differs from what we have stored
					if (event.track && enableAudioNormalization) {
						console.debug('Normalizing audio track')

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
					console.debug(`Completion percentage: ${event.position / event.duration}`)

					const currentTrack = usePlayerQueueStore.getState().currentTrack

					if (currentTrack)
						try {
							await reportPlaybackProgress(api, currentTrack, event.position)
						} catch (error) {
							console.error('Unable to report playback progress', error)
						}

					if (event.position / event.duration > 0.3 && autoDownload && currentTrack) {
						console.debug('Autodownloading current track')
						await saveAudioItem(api, currentTrack.item, downloadingDeviceProfile, true)
						console.debug('Finished autodownloading current track')
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
